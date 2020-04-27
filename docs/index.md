# PICTIONARY SERVER

A Friendly Node JS + HTML5 Canvas + Socket.io for a simple pictionary game with friends!

---

### To Run Server:

  `node app` 

---

### Build Docker (optional)

`docker build -t <namespace>/pictionary .`

Example: 
`docker build -t yanivalfasy/pictionary .`

---

### Dockerized Version (built)

`docker pull yanivalfasy/pictionary`

---
 
### Bind keys for HTTPs support

`docker run -d -v ~/keys:/usr/src/app/keys -p 5000:5000 -p 5443:5443 <namespace>/pictionary:tag`

Example: 
`docker run -d -v ~/keys:/usr/src/app/keys -p 5000:5000 -p 5443:5443 yanivalfasy/pictionary:latest`

*will detect if no keys are available for ssl and default to 5000 (no SSL support)*

---


