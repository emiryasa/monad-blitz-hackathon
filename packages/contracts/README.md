# Sticket Contracts

Monad uyumlu akıllı sözleşmeler Foundry ile geliştirilir.

## İlk kurulum

Repo kökünde:

```bash
git submodule update --init --recursive
cd packages/contracts
forge build
forge test
```

## Yapı

- `EventFactory.sol`: Organizatörlerin etkinlik oluşturduğu ve etkinlikleri indeksleyen fabrika.
- `EventTicket.sol`: Bir etkinliğe ait ERC-721 bilet, zaman kontrollü birincil satış,
  toplu alım, yeniden satış politikası ve check-in mantığı.
- `Deploy.s.sol`: Factory sözleşmesini ağa deploy eden script.

## Deploy

Özel anahtarı repoya yazmayın. Ortam değişkenlerini terminal oturumunda tanımlayın:

```bash
export PRIVATE_KEY=<deployer-private-key>
export MONAD_RPC_URL=<rpc-url>
forge script script/Deploy.s.sol:Deploy --rpc-url "$MONAD_RPC_URL" --broadcast
```

Windows PowerShell kullanıyorsanız `export` yerine `$env:PRIVATE_KEY = "..."` biçimini kullanın.

## Faydalı komutlar

```bash
forge fmt
forge build
forge test -vvv
```
