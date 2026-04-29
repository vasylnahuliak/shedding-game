provider "oci" {
  region = var.region
}

locals {
  vcn_cidr          = "10.0.0.0/16"
  public_subnet_cidr = "10.0.1.0/24"

  vcn_name        = "${var.name_prefix}-vcn"
  igw_name        = "${var.name_prefix}-igw"
  rt_name         = "${var.name_prefix}-public-rt"
  sl_name         = "${var.name_prefix}-public-sl"
  subnet_name     = "${var.name_prefix}-public-subnet"
  instance_name   = "${var.name_prefix}"
}

data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

data "oci_core_images" "ubuntu" {
  compartment_id             = var.tenancy_ocid
  operating_system           = var.image_operating_system
  operating_system_version   = var.image_operating_system_version
  shape                      = var.shape
  sort_by                    = "TIMECREATED"
  sort_order                 = "DESC"

  filter {
    name   = "display_name"
    values = ["^Canonical-Ubuntu-24\\.04-Minimal-aarch64-.*$"]
    regex  = true
  }
}

resource "oci_core_vcn" "vcn" {
  compartment_id = var.compartment_ocid
  cidr_block     = local.vcn_cidr
  display_name   = local.vcn_name
  dns_label      = "sgvcn"
}

resource "oci_core_internet_gateway" "igw" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.vcn.id
  display_name   = local.igw_name
  enabled        = true
}

resource "oci_core_route_table" "public_rt" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.vcn.id
  display_name   = local.rt_name

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.igw.id
  }
}

resource "oci_core_security_list" "public_sl" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.vcn.id
  display_name   = local.sl_name

  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 22
      max = 22
    }
  }

  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 443
      max = 443
    }
  }

  # Allow ping + PMTUD
  ingress_security_rules {
    protocol = "1" # ICMP
    source   = "0.0.0.0/0"
    icmp_options {
      type = 3
      code = 4
    }
  }

  ingress_security_rules {
    protocol = "1"
    source   = local.vcn_cidr
    icmp_options {
      type = 3
    }
  }

  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
  }
}

resource "oci_core_subnet" "public_subnet" {
  compartment_id                 = var.compartment_ocid
  vcn_id                         = oci_core_vcn.vcn.id
  cidr_block                     = local.public_subnet_cidr
  display_name                   = local.subnet_name
  dns_label                      = "public"
  route_table_id                 = oci_core_route_table.public_rt.id
  security_list_ids              = [oci_core_security_list.public_sl.id]
  prohibit_public_ip_on_vnic     = false
}

resource "oci_core_instance" "instance" {
  compartment_id      = var.compartment_ocid
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[var.availability_domain_index].name
  display_name        = local.instance_name
  shape               = var.shape

  shape_config {
    ocpus         = var.ocpus
    memory_in_gbs = var.memory_in_gbs
  }

  source_details {
    source_type             = "image"
    source_id               = data.oci_core_images.ubuntu.images[0].id
    boot_volume_size_in_gbs = var.boot_volume_size_in_gbs
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.public_subnet.id
    assign_public_ip = true
    hostname_label   = "shedding"
  }

  metadata = {
    ssh_authorized_keys = file(pathexpand(var.ssh_public_key_path))
    user_data = base64encode(templatefile("${path.module}/cloud-init.yaml", {}))
  }
}

data "oci_core_vnic_attachments" "instance_vnics" {
  compartment_id = var.compartment_ocid
  instance_id    = oci_core_instance.instance.id
}

data "oci_core_vnic" "instance_vnic" {
  vnic_id = data.oci_core_vnic_attachments.instance_vnics.vnic_attachments[0].vnic_id
}

