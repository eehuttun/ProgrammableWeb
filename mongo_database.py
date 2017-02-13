from datetime import datetime
import time, sys, re, os, pymongo, json
from pymongo import MongoClient
from bson import Binary, Code
from bson.json_util import loads

DEFAULT_DATA_DUMP = "db/export_files/"

class MovieDatabase(object):
	'''
	API to access Movie database. 
	'''
	def __init__(self, client=MongoClient(), db=None):
		'''
		client points to local MongoDB client and db is the database name.
		If db is not given creates a new database called 'mdbst'
		'''
		super(MovieDatabase, self).__init__()
		
		self.client = client
		if db is None:
			self.db = client.mdbst
		else:
			self.db = client[db]

	def import_movies_collection_from_json_dump(self, movie_json_path=None):
		
		movies = self.db.movies
		
		if movie_json_path is None:
			movie_json_path = DEFAULT_DATA_DUMP + "movies_dump.json"
		
		with open(movie_json_path) as data_file:
			movie_data_json = data_file.read()
		
		movie_data_json = loads(movie_data_json)
		#for movie in movie_data_json['movies']:
		#	movies.insert(movie)
		
		for movie in movie_data_json:
			movies.insert(movie)
	
	def import_directors_collection_from_json_dump(self, director_json_path=None):
		directors = self.db.directors
		
		if director_json_path is None:
			director_json_path = DEFAULT_DATA_DUMP + "directors_dump.json"
			
		with open(director_json_path) as data_file:
			director_data_json = data_file.read()
			
		director_data_json = loads(director_data_json)
		
		#for director in director_data_json['directors']:
		#	id = director['id']
		#	if directors.find_one({'id': id}) == None:
		#		directors.insert(director)
	
		for director in director_data_json:
			id = director['id']
			if directors.find_one({'id': id}) == None:
				directors.insert(director)
	
	def import_admins_collection_from_json_dump(self, admins_json_path=None):
		
		admins = self.db.admins
		
		if admins_json_path is None:
			admins_json_path = DEFAULT_DATA_DUMP + "adminss_dump.json"
		
		with open(admins_json_path) as data_file:
			admin_data_json = data_file.read()
		
		admin_data_json = loads(admin_data_json)
		
		for admin in admin_data_json:
			admins.insert(admin)
			
	def load_db_from_dump(self, export_dir=None):
		
		if export_dir == None:
			export_dir = DEFAULT_DATA_DUMP
			
		self.import_movies_collection_from_json_dump(export_dir+"movies_dump.json")
		self.import_admins_collection_from_json_dump(export_dir+"admins_dump.json")
		self.import_directors_collection_from_json_dump(export_dir+"directors_dump.json")
			
	def add_admin(self, nickname, password):
	
		admins = self.db.admins
		
		admin_object = {'nickname': nickname, 'password': password}
		if admins.find_one({"nickname": nickname}):
			return 0
		else:
			admins.insert(admin_object)
			return 1
			
	def add_director(self, name, imdb_id, birth_notes=None, birth_date=None, biography=[], directed_movies=[]):
		
		directors = self.db.directors
		
		if directors.find_one({'id': imdb_id}) != None:
			return 0
		
		director_object = {'id': imdb_id, 'name': name, 'birth_notes': birth_notes, 'birth_date': birth_date, 'biography': biography, 'directed': directed_movies}
		directors.insert(director_object)
		return 1
	
	def edit_director (self, name, imdb_id, birth_notes=None, birth_date=None, biography=[], directed_movies=[]):
		
		stmnt = {'name': name, 'birth_notes': birth_notes, 'birth_date': birth_date, 'biography': biography, 'directed': directed_movies}
		result = self.db.directors.update({"id":imdb_id}, {"$set": stmnt})
		return result
	
	def delete_director (self, director_id):
	
		directors = self.db.directors
		if directors.find_one({'id': director_id}) == None:
			return 0
			
		result = directors.remove({'id': director_id})
		if result['ok'] is 1:
                        return result['n']
		else:
                        return -1

        def get_all_directors (self):

                directors = self.db.directors.find()
                if directors is None:
                        return 0
                else:
                        return directors

        def get_director_info (self, director_name):
                
                director = self.db.directors.find_one({'name':director_name})
                #if director doesn't exist, returns None. Otherwise returns JSON object of the director
                if director is None:
                        return 0
                else:
                        return director

        def get_director_with_id (self, director_id):
                
                director = self.db.directors.find_one({'id':director_id})
                #if director doesn't exist, returns None. Otherwise returns JSON object of the director
                if director is None:
                        return 0
                else:
                        return director

        def get_director_count (self):

                count = self.db.directors.count()
                return count
                
        def add_movie (self, title, imdb_id, year, description, directors=[], genres=[], imdb_url=None, cover_url=None ):
                
		movies = self.db.movies
		
		if movies.find_one({'id': imdb_id}) != None:
			return 0
		starting_rating = { "average_score" : 0, "total_number" : 0 }
		movie_object = {'id':imdb_id,'title':title, 'year':year, 'description':description, 'directors':directors, 'genres':genres, 'imdb_url':imdb_url, 'cover_url':cover_url, 'rating': starting_rating, 'comments':[]}
		
		self.db.movies.insert(movie_object)
		
		return 1
		
	def delete_movie (self, movie_id):
	
		result = self.db.movies.remove({"id" : movie_id})
		if result['ok'] is 1:
                        return result['n']
                else:
                        return -1
		
	def edit_movie_info (self, imdb_id, title, year, description, directors=[], genres=[], imdb_url=None, cover_url=None, rating=None):
		
		stmnt = {'title':title, 'year':year, 'description':description, 'directors':directors, 'genres':genres, 'imdb_url':imdb_url, 'cover_url':cover_url}
                if rating != None:
                        stmnt['rating'] = rating
		
		result = self.db.movies.update({"id":imdb_id}, {"$set": stmnt})
		return result
	
	def get_all_movies(self):

			movies = self.db.movies.find()
			if movies is None:
				return 0
			else:
				return movies

	def get_movie_info (self, movie_name):
			
			movie = self.db.movies.find({'title' : re.compile(movie_name, re.IGNORECASE)})
			#if movie doesn't exist, returns None. Otherwise returns JSON object of the movie
			if movie is None:
				return 0
			else:
				return movie

        def get_movie_with_id (self, movie_id):
                
                movie = self.db.movies.find_one({'id' : movie_id})
		#if movie doesn't exist, returns None. Otherwise returns JSON object of the movie
		if movie is None:
			return 0
		else:
			return movie

	def get_movie_count (self):

			count = self.db.movies.count()
			return count

			
	def contains_movie (self, movie_id):
		
		if self.db.movies.find_one({'id': movie_id}) != None:
			return 1
		else:
			return 0
			
	def get_movie_id (self, movie_title):
			movie = self.db.movies.find_one({"title":movie_title})
			if movie is None:
				return None
			else:
				return movie['id']

	def create_comment (self, movie_id, comment, author_nickname="Anonymous", timestamp=datetime.now().isoformat(' ')):
		
		comments = self.get_comments(movie_id)
		if comments is None:
                        return None
		comment_id = len(comments) + 1
		comment_object = {"id": comment_id, "comment": comment, 'author_nickname': author_nickname, 'timestamp': timestamp}
		comments.append(comment_object)
		
		result = self.db.movies.update({"id": movie_id}, {"$set": {"comments": comments}})
		if result['ok'] is 1:
                        return result['nModified']
                else:
                        return -1
		
	def get_comments(self, movie_id):
		
		movie = self.db.movies.find_one({"id":movie_id})
                if movie is None:
                        return None
                else:
                        return movie['comments']
	
	def delete_comment(self, movie_id, comment_id):
		
		comments = self.get_comments(movie_id)
		
		for i in range(len(comments)):
			if comment_id in comments[i].values():
				comments.remove(comments[i])
				self.db.movies.update({"id": movie_id}, {"$set": {"comments": comments}})
				return 1
		return 0
	
	def edit_comment(self, movie_id, comment_id, new_comment):
		
		comments = self.get_comments(movie_id)
		
		for i in range(len(comments)):
			if comment_id in comments[i].values():
				comments[i]['comment'] = new_comment
				self.db.movies.update({"id": movie_id}, {"$set": {"comments": comments}})
				return 1
		return 0
	
	def add_rating (self, movie_id, rating):
		
		if rating > 10 or rating < 0:
			return 0
		else:
			current_rating = self.db.movies.find_one({"id": movie_id}, fields={"_id": False, "rating": True})
			number = current_rating['rating']['total_number']
			average_score = current_rating['rating']['average_score']
			new_score = (average_score*number + rating)/(number + 1)
			self.db.movies.update({"id": movie_id}, {"$set": {"rating": {'average_score': new_score, 'total_number': number+1}}})
		return 1
