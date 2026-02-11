variable "mode" {
  type = string
}

variable "database_id" {
  type = string
}

variable "database_name" {
  type = string
}

data "external" "merge_environment" {
  program = ["pnpm", "-F", "infra-scripts", "exec", "tsx", "src/update-wrangler.ts", "--mode", var.mode]
  query = {
    database_id   = var.database_id
    database_name = var.database_name
  }
}
