## Usage 

### JavaScript

Using JavaScript, you can make any long URL a short link with this snippet

```js 
fetch(`https://api.nvp.gg/v1/links`, { 
  method: 'POST', 
  headers: { 
    'Accept': 'application/vnd.api+json',
    'Content-Type': 'application/json'
  }, 
  body: JSON.stringify({ originalUrl: window.location.href } )}
)
  .then(req => req.json())
  .then(console.log)
```
Noting that only glimdown.com URLs are free.

## Development

Add to your `/etc/hosts` file

```bash
127.0.0.1 nvp.local
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


Note that because the router has some subdomain routing, we can't use localhost for dev,test,or prod 
