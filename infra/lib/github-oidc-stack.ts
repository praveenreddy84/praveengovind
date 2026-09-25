import { CfnOutput, Stack, type StackProps } from "aws-cdk-lib"
import * as iam from "aws-cdk-lib/aws-iam"
import type { Construct } from "constructs"

export interface GithubOidcStackProps extends StackProps {
  /** `owner/repo` allowed to deploy. */
  githubRepo: string
  /** Branch allowed to deploy. */
  branch?: string
  /** Set when the account already has the GitHub OIDC provider (only one is allowed per account). */
  existingProviderArn?: string
}

/**
 * One-time setup that lets GitHub Actions deploy without stored AWS keys.
 * The role can only be assumed by workflows on `branch` of `githubRepo`, and it
 * can only assume the CDK bootstrap roles, so what it can change is exactly
 * what `cdk deploy` can change.
 */
export class GithubOidcStack extends Stack {
  constructor(scope: Construct, id: string, props: GithubOidcStackProps) {
    super(scope, id, props)

    const branch = props.branch ?? "main"
    const provider = props.existingProviderArn
      ? iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(this, "GithubProvider", props.existingProviderArn)
      : new iam.OpenIdConnectProvider(this, "GithubProvider", {
          url: "https://token.actions.githubusercontent.com",
          clientIds: ["sts.amazonaws.com"],
        })

    const role = new iam.Role(this, "DeployRole", {
      description: `GitHub Actions deploys for ${props.githubRepo}@${branch}`,
      assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
        StringEquals: {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": `repo:${props.githubRepo}:ref:refs/heads/${branch}`,
        },
      }),
    })
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ["sts:AssumeRole"],
        resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
      }),
    )

    new CfnOutput(this, "DeployRoleArn", { value: role.roleArn })
  }
}
