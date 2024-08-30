## Development

Add to your `/etc/hosts` file

```bash
127.0.0.1 nvp.gg
127.0.0.1 docs.nvp.local
127.0.0.1 app.nvp.local
127.0.0.1 api.nvp.local
```

If your system has apache2 by default,
```bash
cd ./config/apache2/
./install.sh
```

This sets up some VirtualHosts that require:
- the API to run on port 5001
- the SPA to run on part 5002

