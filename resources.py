
import json
import urllib

from flask import Flask, request, Response, g, jsonify
from flask.ext.restful import Resource, Api, abort
from werkzeug.exceptions import NotFound,  UnsupportedMediaType
from werkzeug.routing import BaseConverter

from pymongo import MongoClient

import mongo_database


#Constants for hypermedia formats and profiles
COLLECTIONJSON = "application/vnd.collection+json"
HAL = "application/hal+json"
MOVIE_PROFILE = "http://atlassian.virtues.fi:8090/display/PWP/PWP04#PWP04-MDbST_Movie"
DIRECTOR_PROFILE = "http://atlassian.virtues.fi:8090/display/PWP/PWP04#PWP04-MDbST_Director"
COMMENT_PROFILE = "http://atlassian.virtues.fi:8090/display/PWP/PWP04#PWP04-MDbST_Comment"

#Define the application and the api
app = Flask(__name__)

#Start the RESTful API.
api = Api(app)

#Set the database API. Change the DATABASE value from app.config to modify the
#database to be used (for instance for testing)
app.config.update({'DATABASE':mongo_database.MovieDatabase()})

def create_error_response(status_code, title, message, resource_type=None):
    response = jsonify(title=title, message=message, resource_type=resource_type)
    response.status_code = status_code
    return response

@app.errorhandler(404)
def resource_not_found(error):
    return create_error_response(404, "Resource not found", "This resource url does not exist")

@app.errorhandler(500)
def unknown_error(error):
    return create_error_response(500, "Error", "The system has failed. Please, contact the administrator")

@app.before_request
def set_database():
    '''Stores an instance of the database API before each request in the flas.g
    variable accessible only from the application context'''
    g.db = app.config['DATABASE']


#Define the resources
class Movies(Resource):

    def get(self):
    
    
        #INTIAL CHECKING
        #Extract query parameters
        parameters = request.args
        title = parameters.get('title')
        
        if title:
            title=urllib.unquote_plus(title).decode('utf8')
            _movies = g.db.get_movie_info(title)
        else:
            _movies = g.db.get_all_movies()
        envelope = {}
        collection = {}
        envelope['collection'] = collection
        collection['version'] = "1.0"
        collection['href'] = api.url_for(Movies)
        items = []
        for _movie in _movies:
            _movie_id = _movie['id']
            _url = api.url_for(Movie, movie_id=_movie_id)
            movie = {}
            movie['href'] = _url
            movie['data'] = []
            title_info = {'name': 'title', 'value':_movie['title']}
            cover_info = {'name': 'cover_url', 'value':_movie['cover_url']}
            id_info = {'name': 'id', 'value':_movie_id}
            movie['links'] = [{"href" : _url+"comments/"}]
            movie['data'].append(title_info)
            movie['data'].append(cover_info)
            movie['data'].append(id_info)
            items.append(movie)

        collection['items'] = items
        collection['template'] = {
            "data" : [
                {"prompt" : "", "name" : "title", "value" : "", "required": True },
                {"prompt" : "", "name" : "imdb_id", "value" : "", "required": True },
                {"prompt" : "", "name" : "year", "value" : "", "required": True },
                {"prompt" : "", "name" : "description", "value" : "", "required": True },
                {"prompt" : "", "name" : "imdb_url", "value" : "", "required": False },
                {"prompt" : "", "name" : "cover_url", "value" : "", "required": False },
                {"prompt" : "", "name" : "director_name", "value" : "", "required": False }
            ]
        }
        
        return Response (json.dumps(envelope), 200, mimetype=COLLECTIONJSON+";"+MOVIE_PROFILE)

    def post(self):

        #Extract the request body.
        #get_json returns a python dictionary after serializing the request body
        #get_json returns None if the body of the request is not formatted
        # using JSON
        input = request.get_json()
        if not input:
            return create_error_response(415,"Incorrect input format", "Response must be in JSON format", "Movie")

        #It throws a BadRequest exception, and hence a 400 code if the JSON is 
        #not wellformed
        try: 
            data = input['template']['data']
            title = None
            imdb_id = None
            year = None
            description = None
            imdb_url = None
            cover_url = None
            directors = None
            for d in data:
                if d['name'] == 'title':
                    title = d['value']
                elif d['name'] == 'imdb_id':
                    imdb_id = d['value']
                elif d['name'] == 'year':
                    year = d['value']
                elif d['name'] == 'description':
                    description = d['value']
                elif d['name'] == 'imdb_url':
                    imdb_url = d['value']
                elif d['name'] == 'cover_url':
                    cover_url = d['value']
                elif d['name'] == 'director_name':
                    directors = d['value']

            #CHECK THAT DATA RECEIVED IS CORRECT
            if not title or not imdb_id or not year or not description:
                return create_error_response(400, "Wrong request format",
                                             "Be sure you include movie title, id, year and description",
                                             "Movie")
        except: 
            #This is launched if either title or body does not exist or if 
            # the template.data array does not exist.
            return create_error_response(400, "Wrong request format",
                                             "Be sure you include movie title, id, year and description",
                                             "Movie")
        
        #Create the new message and build the response code'
        if not g.db.add_movie(title, imdb_id, year, description, directors=directors, imdb_url=imdb_url, cover_url=cover_url):
            return create_error_response(500, "No new movie id", "Creation of new movie failed")
               
        #Create the Location header with the id of the message created
        url = api.url_for(Movie, movie_id=imdb_id)

        #RENDER
        #Return the response
        return Response(status=201, headers={'Location':url})
        
class Movie(Resource):


    def get(self, movie_id):
        
        _movie = g.db.get_movie_with_id(movie_id)
        if not _movie:
            return create_error_response(404, "Unknown movie",
                                         "There is no a movie with id %s" % movie_id,
                                         "Movie")
        envelope = {}
        links = {}
        links["self"] = {"href" : api.url_for(Movie, movie_id=movie_id), 'profile': MOVIE_PROFILE}
        links["collection"] = { "href" : api.url_for(Movies), 'profile': MOVIE_PROFILE, 'type':COLLECTIONJSON }
        links["comments"] = { "href" : api.url_for(Comments, movie_id=movie_id), 'profile': COMMENT_PROFILE, 'type':COLLECTIONJSON }
        envelope["_links"] = links
        envelope["template"] = {
              "data" : [
                {"prompt" : "", "name" : "title", "value" : "", "required":True},
                {"prompt" : "", "name" : "imdb_id", "value" : "", "required":True},
                {"prompt" : "", "name" : "year", "value" : "", "required":True},
                {"prompt" : "", "name" : "description", "value" : "", "required":True},
                {"prompt" : "", "name" : "imdb_url", "value" : "", "required":False},
                {"prompt" : "", "name" : "cover_url", "value" : "", "required":False},
				{"prompt" : "", "name" : "director_name", "value" : "", "required": False }
              ]
        }
        
        links['directors'] = []
        director_names = []
        for director in _movie["directors"]:
            director_names.append(director['name'])
            director_link = {'href':api.url_for(Director, director_id=director['id']),
                             'profile': DIRECTOR_PROFILE,
                             'type': HAL}
            links['directors'].append(director_link)

        envelope["title"] = _movie["title"]
        envelope["year"] = _movie["year"]
        envelope["imdb_id"] = _movie["id"]
        envelope["imdb_url"] = _movie["imdb_url"]
        envelope["cover_url"] = _movie["cover_url"]
        envelope["genres"] = _movie["genres"]
        envelope["description"] = _movie["description"]
        if _movie["rating"] != None:
            envelope["average_rating"] = _movie["rating"]["average_score"]
            envelope["number_of_ratings"] = _movie["rating"]["total_number"]
        else:
           envelope["average_rating"] = 0
        envelope["directors"] = director_names

        return Response( json.dumps(envelope), 200, mimetype=HAL+";"+MOVIE_PROFILE )

    def delete(self, movie_id):
    
        #PERFORM DELETE OPERATIONS
        if g.db.delete_movie(movie_id):
            return '', 204
        else:
            #Send error message
            return create_error_response(404, "Unknown movie",
                                         "There is no movie with id %s" % movie_id,
                                         "Movie")
                                         
    def put(self, movie_id):
        #CHECK THAT MOVIE EXISTS
        if not g.db.contains_movie(movie_id):
            raise NotFound()

        #PARSE THE REQUEST
        #Extract the request body.
        #get_json returns a python dictionary after serializing the request body
        #get_json returns None if the body of the request is not formatted
        # using JSON
        input = request.get_json()
        if not input:
            return create_error_response(415, "Unsupported Media Type",
                                              "Use a JSON compatible format",
                                              "Movie")


        #It throws a BadRequest exception, and hence a 400 code if the JSON is 
        #not wellformed
        try: 
            data = input['template']['data']
            title = None
            imdb_id = None
            year = None
            description = None
            imdb_url = None
            cover_url = None
			director_name = None
            rating = None
            for d in data:
                if d['name'] == 'title':
                    title = d['value']
                elif d['name'] == 'imdb_id':
                    imdb_id = d['value']
                elif d['name'] == 'year':
                    year = d['value']
                elif d['name'] == 'description':
                    description = d['value']
                elif d['name'] == 'imdb_url':
                    imdb_url = d['value']
                elif d['name'] == 'cover_url':
                    cover_url = d['value']
				elif d['name'] == 'director_name':
                    director_name = d['value']
                elif d['name'] == 'rating':
                    rating = d['value']

            #CHECK THAT DATA RECEIVED IS CORRECT
            if not title or not imdb_id or not year or not description:
                return create_error_response(400, "Wrong request format",
                                             "Be sure you include movie title, id, year and description",
                                             "Movie")
        except: 
            #This is launched if either title, id, year or description does not exist or if 
            # the template.data array does not exist.
            return create_error_response(400, "Wrong request format",
                                             "Be sure you include movie title, id, year and description",
                                             "Movie")
        else:
            #Modify the movie in the database
            if not g.db.edit_movie_info(imdb_id, title, year, description, imdb_url=imdb_url, cover_url=cover_url, directors=director_name, rating=rating):
                return NotFound()
            return '', 204

class Directors(Resource): 
    
    def get(self):
        _directors = g.db.get_all_directors()
        envelope = {}
        collection = {}
        envelope['collection'] = collection
        collection['version'] = "1.0"
        collection['href'] = api.url_for(Directors)
        items = []
        for _director in _directors:
            _url = api.url_for(Director, director_id=_director['id'])
            director = {}
            director['href'] = _url
            data = []
            values = {"name": "name", "value": _director['name']}
            data.append(values)
            director['data'] = data
            director['links'] = []
            items.append(director)
            
        collection['items'] = items
        collection['template'] = {
              "data" : [
                {"prompt" : "", "name" : "name", "value" : "", "required":True},
                {"prompt" : "", "name" : "imdb_id", "value" : "", "required":True},
                {"prompt" : "", "name" : "directed", "value" : "", "required":False},
                {"prompt" : "", "name" : "birth_notes", "value" : "", "required":False},
                {"prompt" : "", "name" : "birth_date", "value" : "", "required":False},
                {"prompt" : "", "name" : "biography", "value" : "", "required":False}
              ]
        }
        
        return Response (json.dumps(envelope), 200, mimetype=COLLECTIONJSON+";"+DIRECTOR_PROFILE)
    
    def post(self):
        #Extract the request body.
        #get_json returns a python dictionary after serializing the request body
        #get_json returns None if the body of the request is not formatted
        # using JSON
        input = request.get_json()
        if not input:
            return create_error_response(415,"Incorrect input format", "Response must be in JSON format", "Movie")

        #It throws a BadRequest exception, and hence a 400 code if the JSON is 
        #not wellformed
        try: 
            data = input['template']['data']
            name = None
            imdb_id = None
            directed = None
            birth_notes = None
            birth_date = None
            biography = None
            for d in data:
                if d['name'] == 'name':
                    name = d['value']
                if d['name'] == 'imdb_id':
                    imdb_id = d['value']
                elif d['name'] == 'directed':
                    directed = d['value']
                elif d['name'] == 'birth_notes':
                    birth_notes = d['value']
                elif d['name'] == 'birth_date':
                    birth_date = d['value']
                elif d['name'] == 'biography':
                    biography = d['value']

            #CHECK THAT DATA RECEIVED IS CORRECT
            if not name or not imdb_id:
                return create_error_response(400, "Wrong request format",
                                             "Be sure you include director name and imdb_id",
                                             "Director")
        except: 
            #This is launched if either title or body does not exist or if 
            # the template.data array does not exist.
            return create_error_response(400, "Wrong request format",
                                             "Be sure to include director name and imdb_id",
                                             "Director")
        
        #Create the new message and build the response code'
        if not g.db.add_director(name, imdb_id, birth_notes, birth_date, biography, directed):
            return create_error_response(500, "No new director id", "Creation of new director failed")
               
        #Create the Location header with the id of the message created
        url = api.url_for(Director, director_id=imdb_id)

        #RENDER
        #Return the response
        return Response(status=201, headers={'Location':url})

class Director(Resource):

    def get(self, director_id):
        _director = g.db.get_director_with_id(director_id)
        if not _director:
            return create_error_response(404, "Unknown director",
                                         "There is no director with id %s" % director_id,
                                         "Director")
        envelope = {}
        links = {}
        links["self"] = {"href" : api.url_for(Director, director_id=director_id) }
        links["collection"] = { "href" : api.url_for(Directors) }
        envelope["_links"] = links
        envelope["template"] = {
              "data" : [
                {"prompt" : "", "name" : "name", "value" : "", "required":True},
                {"prompt" : "", "name" : "imdb_id", "value" : "", "required":True},
                {"prompt" : "", "name" : "directed", "value" : "", "required":False},
                {"prompt" : "", "name" : "birth_notes", "value" : "", "required":False},
                {"prompt" : "", "name" : "birth_date", "value" : "", "required":False},
                {"prompt" : "", "name" : "biography", "value" : "", "required":False}
              ]
        }
        envelope["name"] = _director["name"]
        envelope["id"] = _director["id"]
        envelope["directed"] = _director["directed"]
        envelope["birth_notes"] = _director["birth_notes"]
        envelope["birth_date"] = _director["birth_date"]
        envelope["biography"] = _director["biography"]

        return Response( json.dumps(envelope), 200, mimetype=HAL+";"+DIRECTOR_PROFILE )
    
    def delete(self, director_id):
        #PERFORM DELETE OPERATIONS
        if g.db.delete_director(director_id):
            return '', 204
        else:
            #Send error message
            return create_error_response(404, "Unknown director",
                                         "There is no director with id %s" % director_id,
                                         "Director")
                 
    def put(self, director_id):
        #CHECK THAT DIRECTOR EXISTS
        if not g.db.get_director_with_id (director_id):
            raise NotFound()

        #PARSE THE REQUEST
        #Extract the request body.
        #get_json returns a python dictionary after serializing the request body
        #get_json returns None if the body of the request is not formatted
        # using JSON
        input = request.get_json()
        if not input:
            return create_error_response(415, "Unsupported Media Type",
                                              "Use a JSON compatible format",
                                              "Movie")


        #It throws a BadRequest exception, and hence a 400 code if the JSON is 
        #not wellformed
        try: 
            data = input['template']['data']
            name = None
            imdb_id = None
            directed = None
            birth_notes = None
            birth_date = None
            biography = None
            for d in data:
                if d['name'] == 'name':
                    name = d['value']
                if d['name'] == 'imdb_id':
                    imdb_id = d['value']
                elif d['name'] == 'directed':
                    directed = d['value']
                elif d['name'] == 'birth_notes':
                    birth_notes = d['value']
                elif d['name'] == 'birth_date':
                    birth_date = d['value']
                elif d['name'] == 'biography':
                    biography = d['value']

            #CHECK THAT DATA RECEIVED IS CORRECT
            if not name or not imdb_id:
                return create_error_response(400, "Wrong request format",
                                             "Be sure you include director name and imdb_id",
                                             "Director")
        except: 
            #This is launched if either title or body does not exist or if 
            # the template.data array does not exist.
            return create_error_response(400, "Wrong request format",
                                             "Be sure to include director name and imdb_id",
                                             "Director")
        else:
            #Modify the movie in the database
            if not g.db.edit_director(name, imdb_id, birth_notes, birth_date, biography, directed):
                return NotFound()
            return '', 204

class Comments(Resource):
    
    def get(self, movie_id):
        _comments = g.db.get_comments(movie_id)
        envelope = {}
        collection = {}
        envelope['collection'] = collection
        collection['version'] = "1.0"
        collection['href'] = api.url_for(Comments, movie_id = movie_id)
        items = []
        for _comment in _comments:
            comment_id = _comment["id"]
            _url = api.url_for(Comment, movie_id=movie_id, comment_id=comment_id)
            comment = {}
            comment['href'] = _url
            data = []
            values = {}
            values['comment'] = _comment['comment']
            values['author_nickname'] = _comment['author_nickname']
            values['timestamp'] = _comment['timestamp']
            data.append(values)
            comment['data'] = data
            comment['links'] = []
            items.append(comment)
            
        collection['items'] = items
        collection['template'] = {
              "data" : [
                {"prompt" : "", "name" : "comment", "value" : "", "required":True},
                {"prompt" : "", "name" : "author_nickname", "value" : "", "required":False},
                {"prompt" : "", "name" : "timestamp", "value" : "", "required":False}
              ]
        }
        
        return Response (json.dumps(envelope), 200, mimetype=COLLECTIONJSON+";"+COMMENT_PROFILE)
    
    def post(self, movie_id):
        #Extract the request body.
        #get_json returns a python dictionary after serializing the request body
        #get_json returns None if the body of the request is not formatted
        # using JSON
        input = request.get_json()
        if not input:
            return create_error_response(415,"Incorrect input format", "Response must be in JSON format", "Comment")

        #It throws a BadRequest exception, and hence a 400 code if the JSON is
        #not wellformed
        try: 
            data = input['template']['data']
            comment = None
            author_nickname = None
            for d in data:
                if d['name'] == 'comment':
                    comment = d['value']
                if d['name'] == 'author_nickname':
                    author_nickname = d['value']

            #CHECK THAT DATA RECEIVED IS CORRECT
            if not comment:
                return create_error_response(400, "Wrong request format",
                                             "Be sure you include the comment",
                                             "Comment")
        except: 
            #This is launched if either title or body does not exist or if 
            # the template.data array does not exist.
            return create_error_response(400, "Wrong request format",
                                             "Be sure you include the comment",
                                             "Comment")
        
        #Create the new comment and build the response code'
        comment_id = g.db.create_comment(movie_id, comment, author_nickname)
        if comment_id == -1:
            return create_error_response(500, "No new comment id", "Creation of new comment failed")
               
        #Create the Location header with the id of the comment created
        url = api.url_for(Comment, movie_id=movie_id, comment_id=comment_id)

        #RENDER
        #Return the response
        return Response(status=201, headers={'Location':url})
    
class Comment(Resource):

    def get(self, movie_id, comment_id):
        #CHECK THAT MOVIE EXISTS
        if not g.db.contains_movie(movie_id):
            raise NotFound()
        envelope = {}
        _comments = g.db.get_comments(movie_id)
        _comment = None
        for i in range(len(_comments)):
            if int(comment_id) in _comments[i].values():
                _comment = _comments[i]
        if not _comment:
            return create_error_response(404, "Unknown comment",
                                         "There is no comment with id %s" % comment_id,
                                         "Comment")
        links = {}
        links["self"] = {"href" : api.url_for(Comment, movie_id=movie_id, comment_id=comment_id) }
        links["collection"] = { "href" : api.url_for(Comments, movie_id=movie_id) }
        envelope["_links"] = links
        envelope["template"] = {
              "data" : [
                {"prompt" : "", "name" : "comment", "value" : "", "required":True},
                {"prompt" : "", "name" : "author_nickname", "value" : "", "required":False},
                {"prompt" : "", "name" : "timestamp", "value" : "", "required":False}
              ]
        }
        envelope["comment"] = _comment["comment"]
        envelope["author_nickname"] = _comment["author_nickname"]
        envelope["timestamp"] = _comment["timestamp"]

        return Response( json.dumps(envelope), 200, mimetype=HAL+";"+COMMENT_PROFILE )
    
    def delete(self, movie_id, comment_id):
        #CHECK THAT MOVIE EXISTS
        if not g.db.contains_movie(movie_id):
            raise NotFound()
        #PERFORM DELETE OPERATIONS
        if g.db.delete_comment(movie_id, int(comment_id)):
            return '', 204
        else:
            #Send error message
            return create_error_response(404, "Unknown comment",
                                         "There is no comment with id %s" % comment_id,
                                         "Comment")
    def put(self, movie_id, comment_id):
        #CHECK THAT MOVIE EXISTS
        if not g.db.contains_movie(movie_id):
            return create_error_response(404, "Movie not found", "The movie with id %s does not exist" % movie_id, "Movie")

        #PARSE THE REQUEST
        #Extract the request body.
        #get_json returns a python dictionary after serializing the request body
        #get_json returns None if the body of the request is not formatted
        # using JSON
        input = request.get_json()
        if not input:
            return create_error_response(415,"Incorrect input format", "Response must be in JSON format", "Comment")


        #It throws a BadRequest exception, and hence a 400 code if the JSON is 
        #not wellformed
        try: 
            data = input['template']['data']
            comment = None
            for d in data:
                if d['name'] == 'comment':
                    comment = d['value']

            #CHECK THAT DATA RECEIVED IS CORRECT
            if not comment:
                return create_error_response(400, "Wrong request format",
                                             "Be sure you include the comment",
                                             "Comment")
        except: 
            #This is launched if either comment body does not exist or if 
            # the template.data array does not exist.
            return create_error_response(400, "Wrong request format",
                                             "Be sure you follow the template",
                                             "Comment")
        else:
            #Modify the comment in the database
            if not g.db.edit_comment(movie_id, int(comment_id), comment):
                return create_error_response(500, "Editing failed",
                                             "Editing the comment number %s failed" % comment_id,
                                             "Comment")
            return '', 204



#Define the routes
api.add_resource(Movies, '/mdbst/api/movies/',
                 endpoint='movies')
api.add_resource(Movie, '/mdbst/api/movies/<movie_id>/',
                 endpoint='movie')
api.add_resource(Directors, '/mdbst/api/directors/',
                 endpoint='directors')
api.add_resource(Director, '/mdbst/api/directors/<director_id>/',
                 endpoint='director')
api.add_resource(Comments, '/mdbst/api/movies/<movie_id>/comments/',
                 endpoint='comments')
api.add_resource(Comment, '/mdbst/api/movies/<movie_id>/comments/<comment_id>/',
                 endpoint='comment')


#Start the application
#DATABASE SHOULD HAVE BEEN POPULATED PREVIOUSLY
if __name__ == '__main__':
    #Debug True activates automatic code reloading and improved error messages
    app.run(debug=True)
