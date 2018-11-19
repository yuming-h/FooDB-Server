const db = require('./index.js')

module.exports = async () => {
  await db.query(`DROP TABLE IF EXISTS "user", "restaurant", "menu_item", "driver", "drives", \
  "vehicle", "order", "order_item", "payment_info", "restaurant_review", "driver_review" cascade`)

  await db.query(`CREATE TABLE "user"
    (
      user_id	SERIAL,
      address	VARCHAR(45),
      name		VARCHAR(45),
      email VARCHAR(45) NOT NULL UNIQUE,
      password CHAR(60) NOT NULL,
      phone_num	VARCHAR(10),
      lat		DECIMAL(9,6),
      lon		DECIMAL(9,6),
    
      PRIMARY KEY (user_id)
    );
  `)

  // Don't send password hashes!
  await db.query(`CREATE VIEW "user_info"(user_id, address, name, email, phone_num) AS
    SELECT user_id, address, name, email, phone_num FROM "user";`)

  await db.query(`CREATE TABLE "restaurant"
    (
      restaurant_id	SERIAL,
      name  VARCHAR(45),
      address	VARCHAR(45),
      owner		VARCHAR(45),
      category VARCHAR(45),
      rating DECIMAL(3,2),
      lat	DECIMAL(9,6),
      lon		DECIMAL(9,6),
      img_url VARCHAR(65535),

      PRIMARY KEY (restaurant_id)
    );
  `)

  await db.query(`CREATE TABLE "menu_item"
    (
      name  VARCHAR(100) NOT NULL,
      restaurant_id INTEGER NOT NULL,
      availability BOOLEAN,
      has_allergens BOOLEAN,
      description TEXT,
      price DECIMAL(5,2),
      type  VARCHAR(45),
      img_url VARCHAR(65535),

      PRIMARY KEY (name, restaurant_id),
      FOREIGN KEY (restaurant_id)
        REFERENCES "restaurant"(restaurant_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    );`)


  await db.query(`CREATE TABLE "driver"
    (
      driver_id SERIAL,
      name      VARCHAR(45),
      email     VARCHAR(45) NOT NULL UNIQUE,
      password  CHAR(60) NOT NULL,
      phone_num VARCHAR(10) NOT NULL,
      lat DECIMAL(9,6),
      lon DECIMAL(9,6),

      PRIMARY KEY (driver_id)
    );`)

  // TODO: string makes more sense, made changes to vehicle table, had to add UNIQUE for some reason
  await db.query(`CREATE TABLE "vehicle"
    (
      driver_id    INTEGER NOT NULL,
      vin             VARCHAR(45),
      license_plate   VARCHAR(45),
      make            VARCHAR(45),
      model           VARCHAR(45),
      color           VARCHAR(45),
      year            VARCHAR(45),

      PRIMARY KEY (driver_id, vin),
      UNIQUE(vin),
      FOREIGN KEY (driver_id)
        REFERENCES "driver"(driver_id)
        ON DELETE CASCADE
    );`)

  // TODO: changed datatype for vin, string makes more sense, two primary keys
  await db.query(`CREATE TABLE "drives"
    (
      driver_id INTEGER NOT NULL,
      vin       VARCHAR(45),
      since     TIMESTAMP,

      PRIMARY KEY (driver_id, vin),
      FOREIGN KEY (driver_id)
        REFERENCES "driver"(driver_id)
        ON DELETE CASCADE,
      FOREIGN KEY (vin)
        REFERENCES "vehicle"(vin)
        ON DELETE CASCADE
    );`)

  await db.query(`CREATE TABLE "order"
    (
      order_id          SERIAL,
      driver_id         INTEGER,
      user_id           INTEGER NOT NULL,
      restaurant_id     INTEGER,
      address           VARCHAR(45),
      placed_datetime   TIMESTAMP,
      prepared_datetime   TIMESTAMP,
      received_datetime   TIMESTAMP,
      delivered_datetime   TIMESTAMP,
      special_instructions VARCHAR(300),

      PRIMARY KEY (order_id),
      FOREIGN KEY (driver_id)
        REFERENCES "driver"(driver_id),
      FOREIGN KEY (user_id)
        REFERENCES "user"(user_id)
        ON DELETE CASCADE,
      FOREIGN KEY (restaurant_id)
        REFERENCES "restaurant"(restaurant_id)
    );`)

  await db.query(`CREATE TABLE "order_item"
    (
      line_number 			SERIAL,
      order_id			INTEGER NOT NULL,
      restaurant_id			INTEGER NOT NULL,
      menuitem_name 		VARCHAR(100),	
      quantity 			INTEGER,
      discount 			INTEGER,


      PRIMARY KEY (line_number, order_id),
      FOREIGN KEY (order_id)
        REFERENCES "order"(order_id)
        ON DELETE CASCADE,
      FOREIGN KEY (menuitem_name, restaurant_id)
        REFERENCES "menu_item"(name, restaurant_id)
    );`)

  await db.query(`CREATE TABLE "restaurant_review"
    (
      review_id 		  SERIAL,
      restaurant_id   INTEGER NOT NULL,
      user_id   		INTEGER NOT NULL,
      stars   			SMALLINT NOT NULL,
      title           VARCHAR(150),
      content       	TEXT,
      review_datetime	TIMESTAMP,

      PRIMARY KEY (restaurant_id, review_id),
      FOREIGN KEY (restaurant_id)
        REFERENCES "restaurant"(restaurant_id)
        ON DELETE CASCADE,
      FOREIGN KEY (user_id)
        REFERENCES "user"(user_id) 
        ON DELETE CASCADE
    );`)

    // RESTAURANT RATING TRIGGER

    await db.query(`
    CREATE OR REPLACE FUNCTION update_rating() 
      RETURNS trigger AS $update_rating$
      BEGIN
      UPDATE restaurant
        SET rating = (SELECT AVG(stars) FROM restaurant_review
                            WHERE restaurant_review.restaurant_id = restaurant.restaurant_id)
        WHERE restaurant_id = NEW.restaurant_id;
        RETURN NEW;
      END;
      $update_rating$ LANGUAGE plpgsql;
    `)
  
    await db.query(`CREATE TRIGGER computeRating
    AFTER INSERT ON restaurant_review
        FOR EACH ROW
          EXECUTE FUNCTION update_rating()`)

  await db.query(`CREATE TABLE "driver_review"
    (
      driver_id   INTEGER NOT NULL,
      review_id 		  INTEGER NOT NULL,
      user_id   		INTEGER NOT NULL,
      stars   			SMALLINT NOT NULL,
      review_datetime	TIMESTAMP,

      PRIMARY KEY (driver_id, review_id),
      FOREIGN KEY (driver_id)
        REFERENCES "driver"(driver_id)
        ON DELETE CASCADE,
      FOREIGN KEY (user_id)
        REFERENCES "user"(user_id)
        ON DELETE CASCADE
    );`)


  await db.query(`INSERT INTO "restaurant" (restaurant_id, name, address, owner, category, rating, lat, lon, img_url)
    VALUES  ('1',  'Steveston Fisher', '3 Avenue, Richmond BC','Steven', 'Fast Food', 4.54, 49.124148, -123.186580, 'https://i.imgur.com/R9655as.png'),
            ('2', 'Mercante' ,'6388 University Blvd, Vancouver', 'UBCFood', 'Fast Food', 3.10, 49.263700, -123.255000, 'https://i.imgur.com/9EEv4Ne.jpg'),
            ('3', 'Ronald McDonald''s Fun House' ,'3308 W Broadway, Vancouver', 'McDees', 'Fast Food', 5, 49.264104, -123.178065, 'https://i.imgur.com/fpWQJKa.png'),
            ('4', 'Santouka Ramen', '1690 Robson St, Vancouver, BC V6G 1C7', 'Hitoshi', 'Japanese', '5', '49.290123', '-123.133711', 'https://imgur.com/crkzGiD.png'),
            ('5', 'Ajisai Sushi Bar', '2081 W 42nd Ave, Vancouver, BC V6M 3V3', 'Takashi', 'Japanese', '4.5', '49.233910', '-123.153740', 'https://imgur.com/oMjx5oc.png'),
            ('6', 'Medina Cafe', '780 Richards St, Vancouver, BC V6B 3A4', 'Joshua', 'Brunch', '4.9', '49.279030', '-123.119430', 'https://imgur.com/j6JI8b5.png');`)

  await db.query(`INSERT INTO "driver" (name, email, password, phone_num, lat, lon)
    VALUES  ('Josh', 'ericliu7722@gmail.com', 'ILoveDelivery', '7789195177', '0', '0'),
            ('James', 'ericliu722@gmail.com', 'MEOW', '6043211123', '0', '0');`)

  await db.query(`INSERT INTO "vehicle" (driver_id, vin, license_plate, make, model, color, year)
    VALUES  ('1', '123456-0', 'AB1234', 'Toyota', 'Corrola', 'Red', '2007'),
            ('1', '123456-1', 'AB1235', 'Honda', 'Accord', 'Black', '2009'),
            ('2', '223456-0', 'CB1235', 'Audi', 'A4', 'White', '2017');`)

  await db.query(`INSERT INTO "drives" (driver_id, vin, since)
    VALUES  ('1', '123456-0', '2016-06-22 19:10:25-07'),
            ('1', '123456-1', '2015-06-22 19:10:25-07'),
            ('2', '223456-0', '2016-07-22 19:10:25-07');`)

  await db.query(`INSERT INTO "menu_item" (name, restaurant_id, availability, has_allergens, description, price, type, img_url)
    VALUES  ('Fish Filet', 1, true, true, 'Wha she order?', 24.54, 'Seafood', 'https://i.imgur.com/R9655as.png'),
            ('Fish Sticks', 1, true, true, 'Delicious sticks of fish', 13.21, 'Seafood', ''),
            ('Fish Food', 1, true, true, 'Delicious food for fish', 6.56, 'Seafood', ''),
            ('Salmon Sashimi', 1, true, true, 'Delicious sashimi', 21.50, 'Seafood', ''),
            ('Crepe', 1, true, true, 'Delicious crepe', 2.54, 'Pastries', ''),
            ('Fancy Pizza', 2, true, true, 'Overpriced pizza', 12.10, 'Pizza', ''),
            ('Fancy Pizza 2', 2, true, true, 'Overpriced pizza 2', 15.60, 'Pizza', ''),
            ('McDouble', 3, true, true, 'Cheaper version of the double cheeseburger', 6.56, 'Seafood', ''),
            ('Cheeseburger', 3, true, true, 'Yum', 21.50, 'Seafood', ''),
            ('Big Mac', 3, true, true, 'Bigger than a regular Mac', 2.54, 'Pastries', ''),
            ('Double Cheeseburger', 3, true, true, 'Just like a cheeseburger, but double', 12.10, 'Pizza', ''),
            ('Filet o'' Fish', 3, true, true, 'Delicious filet o fish with creamy sauce', 6.56, 'Seafood', ''),
            ('Chicken Nuggets', 3, true, true, 'Good for snacking on', 21.50, 'Seafood', ''),
            ('French Fries', 3, true, true, 'French-style frites', 2.54, 'Pastries', ''),
            ('"Coke"', 3, true, true, 'Columbian style "coke"', 12.10, 'Pizza', ''),
            ('Shio Ramen', '4', true, false, 'Umami Ramen', 10.99, 'Ramen', 'https://imgur.com/uYHfaBK'),
            ('Miso Ramen', '4', true, false, 'Miso flavour ramen', 10.99, 'Ramen', 'https://imgur.com/1dA6q9X'),
            ('Shoyu Ramen', '4', true, false, 'Soy Sauce flavour ramen', 10.99, 'Ramen', 'https://imgur.com/ZVMoExu'),
            ('Kara-miso Ramen', '4', true, false, 'Spicy Miso Ramen', 10.99, 'Ramen', 'https://imgur.com/iBAUttp'),
            ('California Roll', '5', true, false, 'Very Nice Sushi', 3.99, 'Japanese', 'https://imgur.com/BoHDLQV'),
            ('Unagi Don', '5', true, false, 'Melt in your mouth unagi', 20.99, 'Japanese', 'https://imgur.com/aGoCkt4'),
            ('Uni Don', '5', true, false, 'Custard of the sea', 30.99, 'Japanese', 'https://imgur.com/BrodXm2'),
            ('Omakase', '5', true, true, 'Chef's Selection', 99.99, 'Japanese', 'https://imgur.com/RUDwibJ'),
            ('Meatballs', '6', true, true, 'Mediterranean Meat Balls', 10.99, 'Brunch', ''),
            ('Blueberry Waffles', '6', true, false, 'These waffles are blue and beautiful', 5.99, 'Brunch', '');
            `)

  await db.query(`INSERT INTO "user" (name, email, password, phone_num, address) 
    VALUES ('Steven Zhao', 'steven@zhao.io', '$2a$08$undNp20HMxGoZix1k79uMODYeKE7Z7CDkfmkGKe7HfagyRbbryJQq', '7787077859', '4779 Gothard St')`)

  await db.query(`INSERT INTO "restaurant_review" (restaurant_id, user_id, stars, title, content)
    VALUES  (1, 1, 3, 'Decent food. Very okay.', 'It is an okay restaurant with okay food. It could have been better. 
    The broth is flavorful (without resorting to too much salt & oil), the chashu is flavorful & thin & fatty, and the noodles are made inhouse. 
    
    There is pretty much nothing else on the menu - this is a purist, traditional operation here. 
    
    The modern style thin noodles are not my top preference, but it is more popular these days.
    ')`)

  await db.query(`INSERT INTO "restaurant_review" (restaurant_id, user_id, stars, title, content)
  VALUES  (1, 1, 5, 'Savoury. Yummy.', 'Now is there really another Modern Vietnamese restaurant in Vancouver that is more happening than here? The answer is NO. There is not. Anh and Chi has done an excellent job creating a bright and fresh and vibrant atmosphere while serving darn good authentic Vietnamese. The food is decorative, and the restaurant has a great vibe. Some of my favorite dishes here: Cay Me - Tofu salad roll is excellent! 
  ')`)

  await db.query(`INSERT INTO "restaurant_review" (restaurant_id, user_id, stars, title, content)
  VALUES  (2, 1, 2, 
  'Powerfullly Terrible', 
  'I love how vigorously the Asian dude cuts apart my pizza. However, the cuts are often uneven, terrible!
  ')`)

  await db.query(`INSERT INTO "restaurant_review" (restaurant_id, user_id, stars, title, content)
  VALUES  (2, 1, 3, 
  'Affordable student option', 
  'Cheap but not always the best, the quality changes a lot
  ')`)

  await db.query(`INSERT INTO "restaurant_review" (restaurant_id, user_id, stars, title, content)
  VALUES  (2, 1, 5, 
  'Traditional Italian Pizza', 
  'Simply exquisite, nothing more
  ')`)

  await db.query(`INSERT INTO "restaurant_review" (restaurant_id, user_id, stars, title, content)
  VALUES  (3, 1, 5, 
  'Purest Coke I have every tried', 
  'The Ronald House Columbian coke puts even Pablo Escobar to shame. Highly recommended
  ')`)

  await db.query(`INSERT INTO "restaurant_review" (restaurant_id, user_id, stars, title, content)
  VALUES  (3, 1, 5, 
  'You will not want any other coke', 
  'I have only had coke from Ronald House ever since I tried it.
  ')`)

  await db.query(`INSERT INTO "restaurant_review" (restaurant_id, user_id, stars, title, content)
  VALUES  (4, 1, 3, 
  'Better than Jinya', 
  'At least I did not get food poisoning from Santouka..
  ')`)

  await db.query(`INSERT INTO "restaurant_review" (restaurant_id, user_id, stars, title, content)
  VALUES  (4, 1, 5, 
  'Rich Broth', 
  'The broth tastes like its been boiled for days. Simply beautiful, highly recommend the shio ramen.
  ')`)

  await db.query(`INSERT INTO "restaurant_review" (restaurant_id, user_id, stars, title, content)
  VALUES  (5, 1, 1, 
  'Their price was too expensive', 
  'Uni don is way too expensive, so was the unagi done.
  ')`)

  await db.query(`INSERT INTO "restaurant_review" (restaurant_id, user_id, stars, title, content)
  VALUES  (6, 1, 4, 
  'Love their Blue Waffles', 
  'The blueberry served here is not only beuaitful, but also extremely tasty. The best waffle I ever had.
  ')`)

  await db.query(`INSERT INTO "driver_review" (driver_id, review_id, user_id, stars, review_datetime)
    VALUES  ('1', '1', '1', '5', '2016-06-22 19:10:25-07'),
            ('1', '2', '1', '2', '2016-06-22 18:10:25-07'),
            ('1', '3', '1', '3', '2016-06-22 17:10:25-07'),
            ('2', '3', '1', '5', '2018-06-22 17:10:25-07');`)
}