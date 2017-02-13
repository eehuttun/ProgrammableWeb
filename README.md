﻿Simple movie database RESTful API with a client part to browse, upload, modify and delete movie info (like IMDB). Does not include the database file.

Done for "Programmable web" course in a pair so part of the code is not done by me.


External libraries needed:

	PyMongo Python library
	Unittest Python library
	MongoDB installed on your computer
	Flask Python library
	
Setting up and populating the database:

	Using command line go to the "bin" folder of your MongoDB installation and 
	start MongoDB with the command "mongod". This program must be running to use the database.
	More information at http://docs.mongodb.org/manual/tutorial/manage-mongodb-processes/

	Create and populate database with movies, directors and admins collections by calling 
	"MovieDatabase.load_db_from_dump()" with python. Inside python shell:

	>>> from mongo_database import MovieDatabase
	>>> db = MovieDatabase()
	>>> db.load_db_from_dump()
	
	Exported database JSON files are in db/export_files

	JSON files have been generated by mongoexport. e.g.: 
	"mongoexport --db mdbst --collection movies --out db/export_files/movies_dump.json --jsonArray"

Running the RESTful API

	The mongoDB server must be running during the use of the API. After the database is running the RESTful API can be activated
	by running the resources python file with command "python -m resources". This starts the Flask server and the API can be used normally. For example the collection of movies
	can be then accessed from localhost:5000/mdbst/api/movies/.

	possible resources:
	
	/mdbst/api/movies/					= collection of movie
	/mdbst/api/directors/					= collection of directors
	/mdbst/api/movies/<movie_id>/				= movie object
	/mdbst/api/directors/<director_id>/			= director object
	/mdbst/api/movies/<movie_id>/comments/			= movie objects comments
	/mdbst/api/movies/<movie_id>/comments/<comment_id>/	= comment object

Testing:

	Database can be tested by simply running database_test.py. This prints what is tested and all errors that might happen.
	
	The Resources can be tested with resources_test.py that works the same way as database testing. This tests the resources.py and 
	its get, put, delete and post methods.