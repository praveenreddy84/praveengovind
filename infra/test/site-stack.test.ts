import { strict as assert } from "node:assert"
import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import { describe, it } from "node:test"
import { App } from "aws-cdk-lib"
import { Match, Template } from "aws-cdk-lib/assertions"
import { GithubOidcStack } from "../lib/github-oidc-stack"
import { SiteStack, type SiteStackProps } from "../lib/site-stack"

const env = { account: "123456789012", region: "us-east-1" }

function siteDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "site-"))
  fs.writeFileSync(path.join(dir, "index.html"), "<h1>hi</h1>")
  fs.writeFileSync(path.join(dir, "404.html"), "<h1>404</h1>")
  return dir
}

function synth(props: Partial<SiteStackProps> = {}) {
  const app = new App()
  const stack = new SiteStack(app, "Test", { env, siteDir: siteDir(), ...props })
  return Template.fromStack(stack)
}

describe("SiteStack (static only)", () => {
  const t = synth()

  it("keeps the bucket private and encrypted", () => {
    t.hasResourceProperties("AWS::S3::Bucket", {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
      BucketEncryption: Match.objectLike({}),
    })
  })

  it("lets only CloudFront read the bucket (Origin Access Control)", () => {
    t.resourceCountIs("AWS::CloudFront::OriginAccessControl", 1)
    t.hasResourceProperties("AWS::S3::BucketPolicy", {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: "s3:GetObject",
            Principal: { Service: "cloudfront.amazonaws.com" },
          }),
        ]),
      },
    })
  })

  it("serves HTTPS only, with the 404 page for missing files", () => {
    t.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: Match.objectLike({
        DefaultRootObject: "index.html",
        PriceClass: "PriceClass_100",
        DefaultCacheBehavior: Match.objectLike({ ViewerProtocolPolicy: "redirect-to-https" }),
        CustomErrorResponses: Match.arrayWith([
          Match.objectLike({ ErrorCode: 403, ResponseCode: 404, ResponsePagePath: "/404.html" }),
        ]),
      }),
    })
  })

  it("creates no certificate, DNS records or contact API", () => {
    t.resourceCountIs("AWS::CertificateManager::Certificate", 0)
    t.resourceCountIs("AWS::Route53::RecordSet", 0)
    t.resourceCountIs("AWS::ApiGatewayV2::Api", 0)
  })
})

describe("SiteStack (custom domain)", () => {
  const t = synth({ domainName: "example.com" })

  it("issues a DNS-validated certificate for apex and www", () => {
    t.hasResourceProperties("AWS::CertificateManager::Certificate", {
      DomainName: "example.com",
      SubjectAlternativeNames: ["www.example.com"],
      ValidationMethod: "DNS",
    })
  })

  it("aliases both names to CloudFront over IPv4 and IPv6", () => {
    t.resourceCountIs("AWS::Route53::RecordSet", 4)
    t.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: Match.objectLike({ Aliases: ["example.com", "www.example.com"] }),
    })
  })
})

describe("SiteStack (contact API)", () => {
  const t = synth({ contactEmail: "me@example.com" })

  it("runs the handler on Node 22 / arm64", () => {
    t.hasResourceProperties("AWS::Lambda::Function", {
      Runtime: "nodejs22.x",
      Architectures: ["arm64"],
      Environment: { Variables: { TO_EMAIL: "me@example.com", FROM_EMAIL: "me@example.com" } },
    })
  })

  it("routes /api/* through CloudFront without caching", () => {
    t.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: Match.objectLike({
        CacheBehaviors: [Match.objectLike({ PathPattern: "/api/*", ViewerProtocolPolicy: "https-only" })],
      }),
    })
    t.hasResourceProperties("AWS::ApiGatewayV2::Route", { RouteKey: "POST /api/contact" })
  })

  it("throttles the API", () => {
    t.hasResourceProperties("AWS::ApiGatewayV2::Stage", {
      DefaultRouteSettings: { ThrottlingRateLimit: 2, ThrottlingBurstLimit: 5 },
    })
  })

  it("only allows sending through the configured SES identities", () => {
    const policies = t.findResources("AWS::IAM::Policy")
    const statements = Object.values(policies).flatMap((p: any) => p.Properties.PolicyDocument.Statement)
    const ses = statements.find((s: any) => s.Action === "ses:SendEmail")
    assert.ok(ses, "expected an ses:SendEmail statement")
    const resources = JSON.stringify(ses.Resource)
    assert.match(resources, /identity\/me@example\.com/)
    assert.match(resources, /identity\/example\.com/)
    assert.doesNotMatch(resources, /identity\/\*/)
  })
})

describe("GithubOidcStack", () => {
  const app = new App()
  const t = Template.fromStack(new GithubOidcStack(app, "Oidc", { env, githubRepo: "owner/repo" }))

  it("trusts only the main branch of the repo", () => {
    t.hasResourceProperties("AWS::IAM::Role", {
      AssumeRolePolicyDocument: {
        Statement: [
          Match.objectLike({
            Action: "sts:AssumeRoleWithWebIdentity",
            Condition: {
              StringEquals: {
                "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
                "token.actions.githubusercontent.com:sub": "repo:owner/repo:ref:refs/heads/main",
              },
            },
          }),
        ],
      },
    })
  })

  it("can only assume the CDK bootstrap roles", () => {
    t.hasResourceProperties("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: [
          { Action: "sts:AssumeRole", Effect: "Allow", Resource: "arn:aws:iam::123456789012:role/cdk-*" },
        ],
      },
    })
  })
})
