# FitTech

Plataforma de gestão fitness composta por uma aplicação administrativa web, um aplicativo mobile e uma API central.

## Arquitetura

```
                         FIT PLATFORM
                              │
             ┌────────────────┴────────────────┐
             │                                  │
        💻 FIT ADMIN                     📱 FIT MOBILE
           Angular                      Angular + Ionic
                                            +
                                         Capacitor
             │                                  │
             │                            SQLite local
             │                                  │
             └──────────────┬───────────────────┘
                             │
                        HTTPS / REST
                             │
                             ▼
                     🟣 ASP.NET CORE API
                             │
                ┌────────────┼────────────┐
                │            │            │
              Auth        Negócio       Sync
                │            │            │
                └────────────┼────────────┘
                             ▼
                      Entity Framework
                             │
                             ▼
                   🐘 PostgreSQL / Neon
```

### Componentes

- **FIT Admin** — aplicação web em Angular utilizada pela equipe administrativa.
- **FIT Mobile** — aplicativo em Angular + Ionic + Capacitor, com persistência local em SQLite para uso offline.
- **API** — backend em ASP.NET Core, responsável por autenticação, regras de negócio e sincronização de dados.
- **Persistência** — acesso a dados via Entity Framework, com banco PostgreSQL hospedado no Neon.

### Comunicação

Os clientes (Admin e Mobile) se comunicam com a API exclusivamente via HTTPS/REST. O app mobile mantém uma base SQLite local para funcionamento offline, sincronizando com a API quando há conexão disponível.
