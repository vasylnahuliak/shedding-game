# OCI Terraform (Always Free) — infra без “кліків”

Цей каталог піднімає **з нуля** (кодом) мінімальну інфраструктуру для деплою стека з `deploy/oracle`:

- VCN + public subnet
- Internet Gateway + route `0.0.0.0/0`
- Security List з inbound `22/80/443`
- ARM інстанс `VM.Standard.A1.Flex` (за замовчуванням `4 OCPU / 24 GB`)
- Public IPv4 на primary VNIC
- `cloud-init`: ставить Docker, вмикає `ufw`, відкриває `22/80/443`

Далі ти деплоїш апку докером за інструкцією з `deploy/oracle/README.md`.

## Варіант А (рекомендовано): запуск Terraform в OCI Cloud Shell

Cloud Shell вже має авторизацію в OCI, тому **не треба** створювати API key на своєму компʼютері.

1. В OCI Console відкрий **Cloud Shell**.
2. В Cloud Shell виконай:

```bash
git clone <URL_твого_репозиторію> shedding-game
cd shedding-game/deploy/oracle/terraform
cp terraform.tfvars.example terraform.tfvars
```

3. Відредагуй `terraform.tfvars` (мінімум `compartment_ocid` і `ssh_public_key_path`).
4. Запусти:

```bash
terraform init
terraform apply
```

Після `apply` Terraform виведе `public_ip`, `ssh_command`, `app_domain_nip_io`.

## Варіант B: запуск Terraform локально

1. Встанови інструменти:

```bash
brew install terraform oci-cli
oci setup config
```

2. Далі як у Варіанті А, але запускай Terraform локально.

## Після створення інстанса

1. Підключись по SSH командою з output `ssh_command`.
2. Клонуй репо на VM і підніми стек:
   - `deploy/oracle/README.md`

## Destroy (видалити все, що створив Terraform)

```bash
terraform destroy
```
