terraform {
  required_providers {
    auth0 = {
      source  = "auth0/auth0"
      version = "~> 1.33.0"
    }
  }
}

variable "auth0_callback" {
  type = string
}

variable "auth0_logout_url" {
  type = string
}

variable "auth0_web_origin" {
  type = string
}

variable "auth0_resource_identifier" {
  type = string
}

variable "auth0_app_name" {
  type = string
}

provider "auth0" {
  domain = "enchan.jp.auth0.com"
  debug  = true
}

resource "auth0_client" "client" {
  name                = "${var.auth0_app_name}-client"
  description         = ""
  app_type            = "spa"
  callbacks           = [var.auth0_callback]
  allowed_logout_urls = [var.auth0_logout_url]
  web_origins         = [var.auth0_web_origin]
  oidc_conformant     = true

  jwt_configuration {
    alg = "RS256"
  }
}

resource "auth0_resource_server" "resource_server" {
  name       = "${var.auth0_app_name}-resource"
  identifier = var.auth0_resource_identifier
}

output "auth0_app_client_id" {
  value = auth0_client.client.client_id
}
