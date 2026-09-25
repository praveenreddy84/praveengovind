import * as path from "node:path"
import { CfnOutput, Duration, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib"
import * as apigw from "aws-cdk-lib/aws-apigatewayv2"
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations"
import * as acm from "aws-cdk-lib/aws-certificatemanager"
import * as cloudfront from "aws-cdk-lib/aws-cloudfront"
import * as origins from "aws-cdk-lib/aws-cloudfront-origins"
import * as iam from "aws-cdk-lib/aws-iam"
import * as lambda from "aws-cdk-lib/aws-lambda"
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs"
import * as logs from "aws-cdk-lib/aws-logs"
import * as route53 from "aws-cdk-lib/aws-route53"
import * as targets from "aws-cdk-lib/aws-route53-targets"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment"
import type { Construct } from "constructs"

export interface SiteStackProps extends StackProps {
  /** Directory with the static export (`STATIC_EXPORT=1 npm run build` → `out/`). */
  siteDir: string
  /** Optional custom domain, e.g. `praveengovind.com`. Also serves `www.` and redirects it to the apex. */
  domainName?: string
  /** Route 53 hosted zone that owns `domainName`. Defaults to `domainName`. */
  hostedZoneName?: string
  /** SES-verified address that receives contact form messages. Omit to skip the contact API. */
  contactEmail?: string
  /**
   * SES-verified sender. Defaults to `contactEmail`. Prefer an address on your own domain:
   * mail "from" gmail.com sent through SES fails DMARC checks and tends to land in spam.
   */
  contactFromEmail?: string
}

/**
 * Static portfolio on a private S3 bucket behind CloudFront, plus an optional
 * `/api/contact` endpoint (API Gateway HTTP API → Lambda → SES) served from the
 * same domain so the browser never needs CORS.
 */
export class SiteStack extends Stack {
  constructor(scope: Construct, id: string, props: SiteStackProps) {
    super(scope, id, props)

    const { siteDir, domainName, contactEmail } = props
    const contactFromEmail = props.contactFromEmail || contactEmail

    // --- Storage: private bucket, readable only by CloudFront (Origin Access Control)
    const bucket = new s3.Bucket(this, "SiteBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      // A portfolio is fully reproducible from git, so tearing down the stack may delete it.
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    })

    // --- Optional custom domain + TLS certificate (this stack is deployed to us-east-1,
    // which is where CloudFront requires its certificates to live).
    let zone: route53.IHostedZone | undefined
    let certificate: acm.ICertificate | undefined
    const domainNames: string[] = []
    if (domainName) {
      zone = route53.HostedZone.fromLookup(this, "Zone", {
        domainName: props.hostedZoneName || domainName,
      })
      domainNames.push(domainName, `www.${domainName}`)
      certificate = new acm.Certificate(this, "Certificate", {
        domainName,
        subjectAlternativeNames: [`www.${domainName}`],
        validation: acm.CertificateValidation.fromDns(zone),
      })
    }

    // Next.js static export writes `/work/index.html`; map pretty URLs onto those files
    // and send `www.` visitors to the apex domain.
    const router = new cloudfront.Function(this, "Router", {
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var req = event.request;
  var host = req.headers.host && req.headers.host.value;
  if (host && host.indexOf("www.") === 0) {
    return {
      statusCode: 301,
      statusDescription: "Moved Permanently",
      headers: { location: { value: "https://" + host.slice(4) + req.uri } },
    };
  }
  if (req.uri.endsWith("/")) {
    req.uri += "index.html";
  } else if (req.uri.split("/").pop().indexOf(".") === -1) {
    req.uri += "/index.html";
  }
  return req;
}`),
    })

    const securityHeaders = new cloudfront.ResponseHeadersPolicy(this, "SecurityHeaders", {
      securityHeadersBehavior: {
        strictTransportSecurity: {
          accessControlMaxAge: Duration.days(365),
          includeSubdomains: true,
          preload: false,
          override: true,
        },
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: cloudfront.HeadersFrameOption.DENY, override: true },
        referrerPolicy: {
          referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
          override: true,
        },
      },
    })

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      comment: "Praveen Govind portfolio",
      defaultRootObject: "index.html",
      domainNames: domainNames.length ? domainNames : undefined,
      certificate,
      minimumProtocolVersion: certificate ? cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021 : undefined,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      // North America + Europe edges only: the cheapest tier, plenty for a personal site.
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: securityHeaders,
        compress: true,
        functionAssociations: [{ function: router, eventType: cloudfront.FunctionEventType.VIEWER_REQUEST }],
      },
      // Without s3:ListBucket, S3 answers 403 for missing keys; show the site's 404 page for both.
      errorResponses: [403, 404].map((httpStatus) => ({
        httpStatus,
        responseHttpStatus: 404,
        responsePagePath: "/404.html",
        ttl: Duration.minutes(5),
      })),
    })

    // --- Contact API: POST /api/contact on the same CloudFront domain
    if (contactEmail) {
      const contactFn = new NodejsFunction(this, "ContactFunction", {
        entry: path.join(__dirname, "../lambda/contact.ts"),
        runtime: lambda.Runtime.NODEJS_22_X,
        architecture: lambda.Architecture.ARM_64,
        memorySize: 256,
        timeout: Duration.seconds(10),
        environment: { TO_EMAIL: contactEmail, FROM_EMAIL: contactFromEmail! },
        logGroup: new logs.LogGroup(this, "ContactLogs", {
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
        bundling: { minify: true, sourceMap: false },
      })
      // SES authorizes against the sender's identity (address or its domain) and, while the
      // account is in the SES sandbox, the recipient's identity too.
      const identities = new Set([contactEmail, contactFromEmail!, contactFromEmail!.split("@")[1]])
      contactFn.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ["ses:SendEmail"],
          resources: [...identities].map((resourceName) =>
            this.formatArn({ service: "ses", resource: "identity", resourceName }),
          ),
        }),
      )

      const api = new apigw.HttpApi(this, "ContactApi", { description: "Portfolio contact form" })
      api.addRoutes({
        path: "/api/contact",
        methods: [apigw.HttpMethod.POST],
        integration: new HttpLambdaIntegration("ContactIntegration", contactFn),
      })
      // Throttle hard: a contact form needs a handful of requests, not thousands.
      const stage = api.defaultStage?.node.defaultChild as apigw.CfnStage
      stage.defaultRouteSettings = { throttlingRateLimit: 2, throttlingBurstLimit: 5 }

      distribution.addBehavior("/api/*", new origins.HttpOrigin(`${api.apiId}.execute-api.${this.region}.amazonaws.com`), {
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        responseHeadersPolicy: securityHeaders,
      })
    }

    // --- Upload the site and invalidate the CDN cache on every deploy
    new s3deploy.BucketDeployment(this, "DeploySite", {
      sources: [s3deploy.Source.asset(siteDir)],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ["/*"],
      memoryLimit: 512,
      // Edges keep files until the next deploy invalidates them; browsers revalidate after 5 min.
      cacheControl: [s3deploy.CacheControl.fromString("public, max-age=300")],
    })

    // --- DNS
    if (zone && domainName) {
      const target = route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution))
      for (const recordName of [domainName, `www.${domainName}`]) {
        new route53.ARecord(this, `A-${recordName}`, { zone, recordName, target })
        new route53.AaaaRecord(this, `AAAA-${recordName}`, { zone, recordName, target })
      }
    }

    new CfnOutput(this, "DistributionDomain", { value: distribution.distributionDomainName })
    new CfnOutput(this, "SiteUrl", { value: `https://${domainName ?? distribution.distributionDomainName}` })
    new CfnOutput(this, "BucketName", { value: bucket.bucketName })
  }
}
