output "public_ip" {
  value       = data.oci_core_vnic.instance_vnic.public_ip_address
  description = "Instance public IPv4."
}

output "ssh_command" {
  value       = "ssh ubuntu@${data.oci_core_vnic.instance_vnic.public_ip_address}"
  description = "SSH command (add -i /path/to/key if you use a non-default key)."
}
