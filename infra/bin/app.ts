import * as path from "node:path"
import { App, Tags } from "aws-cdk-lib"
import { GithubOidcStack } from "../lib/github-oidc-stack"
import { SiteStack } from "../lib/site-stack"

const app = new App()

// Context values come from cdk.json and can be overridden with `-c key=value`.
// Empty strings mean "not set".
const ctx = (key: string): string | undefined => {
  const value = app.node.tryGetContext(key)
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

// CloudFront certificates must live in us-east-1, so the whole site stack does too.
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: "us-east-1" }

new SiteStack(app, "PortfolioSite", {
  env,
  description: "Praveen Govind portfolio: S3 + CloudFront + serverless contact API",
  siteDir: path.resolve(__dirname, "..", ctx("siteDir") ?? "../out"),
  domainName: ctx("domainName"),
  hostedZoneName: ctx("hostedZoneName"),
  contactEmail: ctx("contactEmail"),
  contactFromEmail: ctx("contactFromEmail"),
})

new GithubOidcStack(app, "PortfolioGithubDeploy", {
  env,
  description: "Lets GitHub Actions deploy the portfolio via OIDC (no stored keys)",
  githubRepo: ctx("githubRepo") ?? "praveenreddy84/praveengovind",
  existingProviderArn: ctx("githubOidcProviderArn"),
})

Tags.of(app).add("project", "praveengovind-portfolio")
