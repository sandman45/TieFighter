## Deployment

### AWS EC2



SSH into server and run this command => Redirect 3000 to 80 .. this is so it will run when you navigate to `tie-fighter.mattsanders.org` without the port number
```
sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000
```

