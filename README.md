# FooDB-Client

FooDB is a term-long project made in CPSC 304 to demonstrate good design for relational databases. The idea was to create a system to model a food delivery service somewhat similar to Foodora, UberEats, etc. We had to consider facets like encryption for passwords, live delivery status, and more in order to create an app that people could actually use.



## Server

This repository represents the backend server for our app, fully implemented with Node.js and using Express.js to provide a set of REST endpoints with security in mind for users, drivers, and restaurant owners alike. Endpoints for interacting with our database sanitize data as to prevent injection attacks. All endpoints were made  with ease-of-use in mind for gathering data for the React frontend client. The specific endpoints can all be found in the `routes`directory.



## Schema

The database was made with a self-hosted PostgreSQL instance and the entire server was made so that it could be containerized and deployed with Docker. The schema can be found below, where underlined items constitute primary keys and thick arrows represent unique relationships.

![er-diagram](/Users/yuming/Undergrad/2018WT1/CPSC304/project/FooDB-Server/assets/er-diagram.png)