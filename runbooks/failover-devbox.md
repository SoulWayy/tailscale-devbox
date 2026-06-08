# Runbook: Devbox Failover

Primary Devbox offline → switch to backup from `config.yaml` / `fleet/registry.yaml`.

## Decision tree

```
1. Try primary (config.primary_host)
   └── timeout/refused?
       2. Try backup (config.backup_host)
           └── timeout/refused?
               3. Try extra hosts (config.extra_hosts)
```

## Health check

```bash
ssh -o ConnectTimeout=5 -p 22222 deploy@devbox-1.your-tailnet.ts.net "hostname && uptime"
tailscale ping devbox-1
tailscale status
```

## Update dispatch context

```
ACTIVE_DEVBOX=devbox-2
ACTIVE_SSH=ssh -p 22222 deploy@devbox-2
```

See [brain-dispatch.md](brain-dispatch.md).