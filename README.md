# FooDB-Server

FooDB is a term-long project made in CPSC 304 to demonstrate good design for relational databases. The idea was to create a system to model a food delivery service somewhat similar to Foodora, UberEats, etc. We had to consider facets like encryption for passwords, live delivery status, and more in order to create an app that people could actually use.



## Server

This repository represents the backend server for our app, fully implemented with Node.js and using Express.js to provide a set of REST endpoints with security in mind for users, drivers, and restaurant owners alike. Endpoints for interacting with our database sanitize data as to prevent injection attacks. All endpoints were made  with ease-of-use in mind for gathering data for the React frontend client. The specific endpoints can all be found in the `routes`directory.



## Schema and Spec

The database was made with a self-hosted PostgreSQL instance. The schema can be found below, where underlined items constitute primary keys and thick arrows represent unique (exactly one) relationships.

![er-diagram](/assets/er-diagram.png)

### Normalization
Our design is normalized to Boyce-Codd Normal Form (BCNF). The primary keys for most of the relations have uniquely generated IDs (thanks PostgreSQL!) which determine all other keys for the given relation. Take User for example: each User is identified by a unique user_id, which determines all the other user info, i.e. user_id -> address, name. phone_num, lat, lon. Clearly, the relation is in BCNF since this is the only functional dependency, and user_id is a (super)key. The same logic can be applied to every other table with a unique ID.

```
rtDeliverer(deliverer_id, lat, lon) 
	Primary Key:	deliverer_id
	Dependencies:	deliverer_id -> lat, lon

Drone(deliverer_id, model, battery)
	Primary Key:	deliverer_id
	Foreign Key:	deliverer_id references rtDeliverer
	Dependencies:	deliverer_id -> model, battery

Driver(deliverer_id, name, rating, phone_num)
	Primary Key:	deliverer_id
	Foreign Key:	deliverer_id references rtDeliverer
DependenciMes:	deliverer_id -> name, rating, phone_num

Drives(deliverer_id, vin, since)
	Primary Key: 	(deliverer_id, vin)
  	Foreign Key:	deliverer_id references Driver
				vin references Vehicle
	Dependencies:	deliverer_id, vin -> since

Vehicle(vin, license_plate, make, model, color, year)
	Primary Key:	vin
	Dependencies:	vin -> license_plate, make, model, color, year

Order(order_id, deliverer_id, user_id, restaurant_id, address, placed_datetime, delivered_datetime, received_datetime, special_instructions)
	Primary Key: 	order_id
	Foreign Key: 	deliverer_id references rtDeliverer	NOT NULL
				user_id references User			NOT NULL
				restaurant_id references Restaurant	NOT NULL
	Dependencies:	order_id -> deliverer_id, user_id, restaurant_id,
						 address, placed_datetime,
 						 delivered_datetime,
						 received_datetime,
 						 special_instructions
]


OrderItem(line_number, order_id, restaurant_id, menuitem_name, quantity, discount)
	Primary Key: 	line_number, order_id
	Foreign Key:	order_id references Order
				(menuitem_name, restaurant) references MenuItem
	Dependencies:	line_number, order_id -> restaurant_id,
   			Menuitem_name

MenuItem(name, restaurant_id, availability, has_allergens, description, price, type)
	Primary Key:    (name, restaurant_id)
	Foreign Key:    restaurant_id references Restaurant	NOT NULL
	Dependencies:	name, restaurant_id -> availability,
			has_allergens,
			description, price, type

PaymentInfo(card_num, user_id, name, exp_date, cvc)
	Primary Key:	card_num, user_id
	Foreign Key:	user_id references User			NOT NULL
	Dependencies:	card_num, user_id -> name, exp_date, cvc

User(user_id, main_address, name, phone_num, lat, lon)
	Primary Key:	user_id
	Dependencies:	user_id -> main_address, name, phone_num, lat,
			lon

Restaurant(restaurant_id, owner, category, rating, hours, lat, lon)
	Primary Key:	restaurant_id
	Dependencies:	restaurant_id -> owner, category, rating, hours,address

Review(review_id, user_id, review_datetime, stars)
	Primary Key:	review_id
	Foreign Key:	user_id references User			NOT NULL
	Dependencies:	review_id -> user_id, review_datetime, stars

RestaurantReview(review_id, restaurant_id, content)
	Primary Key:	review_id, restaurant_id
	Foreign Key:	review_id references Review
			restaurant_id references Restaurant
	Dependencies:	review_id, restaurant_id -> content

DelivererReview(review_id, deliverer_id)
	Primary Key:	review_id, deliverer_id
	Foreign Key:	review_id references Review
			deliverer_id references Deliverer
	Dependencies:	None
```


