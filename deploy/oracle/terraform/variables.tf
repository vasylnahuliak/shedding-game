variable "region" {
  type        = string
  description = "OCI region, e.g. eu-frankfurt-1"
  default     = "eu-frankfurt-1"
}

variable "tenancy_ocid" {
  type        = string
  description = "Root tenancy OCID (needed for availability domains and image lookup)."
}

variable "compartment_ocid" {
  type        = string
  description = "Compartment OCID where resources will be created."
}

variable "name_prefix" {
  type        = string
  description = "Resource name prefix."
  default     = "shedding-game"
}

variable "availability_domain_index" {
  type        = number
  description = "0-based index in the AD list."
  default     = 0
}

variable "ssh_public_key_path" {
  type        = string
  description = "Path to your SSH public key (e.g. ~/.ssh/id_rsa.pub)."
  default     = "~/.ssh/id_rsa.pub"
}

variable "shape" {
  type        = string
  description = "OCI compute shape."
  default     = "VM.Standard.A1.Flex"
}

variable "ocpus" {
  type        = number
  description = "OCPU count (Always Free max total is typically 4 for A1)."
  default     = 4
}

variable "memory_in_gbs" {
  type        = number
  description = "Memory (GB). Always Free max total is typically 24GB for A1."
  default     = 24
}

variable "boot_volume_size_in_gbs" {
  type        = number
  description = "Boot volume size in GB."
  default     = 60
}

variable "image_operating_system" {
  type        = string
  description = "Image operating system filter."
  default     = "Canonical Ubuntu"
}

variable "image_operating_system_version" {
  type        = string
  description = "Image operating system version filter."
  default     = "24.04 Minimal aarch64"
}

