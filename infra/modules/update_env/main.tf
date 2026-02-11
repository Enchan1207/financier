variable "mode" {
  type=string
}

variable "auth0_app_client_id" {
  type=string
}

data "external" "merge_environment" {
  program = ["pnpm", "-F", "infra-scripts", "exec", "tsx", "src/update-env.ts", "--mode", var.mode]
  query = {
    VITE_AUTH0_CLIENT_ID = var.auth0_app_client_id
  }
}
