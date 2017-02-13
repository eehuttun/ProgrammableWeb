import json
import resources
from flask import Flask, request, Response, g, jsonify
import unittest

class resourceTest(unittest.TestCase):

    test_movie = { "template": { "data" : [
        {"prompt" : "", "name" : "title",         "value" : "Test movie"},
        {"prompt" : "", "name" : "imdb_id",       "value" : "9999999"},
        {"prompt" : "", "name" : "year",          "value" : "2015"},
        {"prompt" : "", "name" : "description",   "value" : "test"},
        {"prompt" : "", "name" : "imdb_url",      "value" : ""},
        {"prompt" : "", "name" : "cover_url",     "value" : ""},
        {"prompt" : "", "name" : "director_name", "value" : "Test Director"}
        ]
    }}

    test_director = { "template": { "data" : [
        {"prompt" : "", "name" : "name",        "value" : "test name"},
        {"prompt" : "", "name" : "imdb_id",     "value" : "9999999"},
        {"prompt" : "", "name" : "directed",    "value" : "Test movie"},
        {"prompt" : "", "name" : "birth_notes", "value" : "test"},
        {"prompt" : "", "name" : "birth_date",  "value" : "1.1.1970"},
        {"prompt" : "", "name" : "biography",   "value" : "test"}
        ]
    }}
    test_comment = { "template": { "data" : [
        {"prompt" : "", "name" : "comment", "value" : "test comment"},
        {"prompt" : "", "name" : "author_nickname", "value" : "tester"},
        {"prompt" : "", "name" : "timestamp", "value" : ""}
        ]
    }}
    
    @classmethod
    def setUpClass(cls):
        print "Testing ", cls.__name__
        
    def setUp(self):
        resources.app.config['TESTING'] = True
        self.app = resources.app.test_client()
        
    def test_movies_resource(self):
        print "testing the movies resource"
        print "  sending get request to get all the movies"
        r = self.app.get('/mdbst/api/movies/')
        self.assertEqual(r.status_code, 200)
        print "  posting a test movie"
        r = self.app.post('/mdbst/api/movies/',
                          data=json.dumps(self.test_movie),
                          headers={'content-type':'application/json'})
        self.assertEqual(r.status_code, 201)
        movie_url = r.headers['location']
        print "  deleting the test_movie"
        r = self.app.delete(movie_url)
        self.assertEqual(r.status_code, 204)
        print "  posting non-json request"
        r = self.app.post('/mdbst/api/movies/',
                          data="this is not json, it is a string",
                          headers={'content-type':'text/html'})
        self.assertEqual(r.status_code, 415)
        
    def test_movie_resource(self):
        print "testing the movie resource"
        print "  posting the test movie"
        r = self.app.post('/mdbst/api/movies/',
                          data=json.dumps(self.test_movie),
                          headers={'content-type':'application/json'})
        self.assertEqual(r.status_code, 201)
        movie_url = r.headers['location']
        print "  sending get request to get the movie"
        r = self.app.get(movie_url)
        self.assertEqual(r.status_code, 200)
        print "  sending put request to the new movie"
        r = self.app.put(movie_url,
                         data=json.dumps(self.test_movie),
                         headers={'content-type':'application/json'})
        self.assertEqual(r.status_code, 204)
        print "  deleting the test_movie"
        r = self.app.delete(movie_url)
        self.assertEqual(r.status_code, 204)
        print "  checking if the deleted movie still exists"
        r = self.app.get(movie_url)
        self.assertEqual(r.status_code, 404)

    def test_directors_resource(self):
        print "testing the directors resource"
        print "  sending get request to get all the directors"
        r = self.app.get('/mdbst/api/directors/')
        self.assertEqual(r.status_code, 200)
        
        print "  posting a test director"
        r = self.app.post('/mdbst/api/directors/',
                          data=json.dumps(self.test_director),
                          headers={'content-type':'application/json'})
        self.assertEqual(r.status_code, 201)
        director_url = r.headers['location']
        
        print "  deleting the test director"
        r = self.app.delete(director_url)
        self.assertEqual(r.status_code, 204)
        print "  posting non-json request"
        r = self.app.post('/mdbst/api/directors/',
                          data="this is not json. it is a string",
                          headers={'content-type':'text/html'})
        self.assertEqual(r.status_code, 415)

    def test_director_resource(self):
        print "testing the director resource"
        print "  posting the test director"
        r = self.app.post('/mdbst/api/directors/',
                          data=json.dumps(self.test_director),
                          headers={'content-type':'application/json'})
        self.assertEqual(r.status_code, 201)
        director_url = r.headers['location']

        print "  sending a get request to get the director"
        r = self.app.get(director_url)
        self.assertEqual(r.status_code, 200)

        print "  sending put request to the new director"
        r = self.app.put(director_url,
                         data=json.dumps(self.test_director),
                         headers={'content-type':'application/json'})
        self.assertEqual(r.status_code, 204)
        
        print "  deleting the test director"
        r = self.app.delete(director_url)
        self.assertEqual(r.status_code, 204)

    def test_comments_resource(self):
        print "testing the comments resource"
        print "  posting a test movie for comments"
        r = self.app.post('/mdbst/api/movies/',
                          data=json.dumps(self.test_movie),
                          headers={'content-type':'application/json'})
        self.assertEqual(r.status_code, 201)
        movie_url = r.headers['location']
        
        print "  sending get request to get all the comments"
        r = self.app.get(movie_url+'comments/')
        self.assertEqual(r.status_code, 200)
        
        print "  posting a test comment"
        r = self.app.post(movie_url+'comments/',
                          data=json.dumps(self.test_comment),
                          headers={'content-type':'application/json'})
        self.assertEqual(r.status_code, 201)
        comment_url = r.headers['Location']
        
        print "  deleting the test comment"
        r = self.app.delete(comment_url)

        print "  posting a non-json request"
        r = self.app.post(movie_url+'comments/',
                          data="this is not json, it is a string",
                          headers={'content-type':'text/html'})
        self.assertEqual(r.status_code, 415)
        
        print "  deleting the test_movie"
        r = self.app.delete(movie_url)
        self.assertEqual(r.status_code, 204)

    def test_comment_resource(self):
        print "testing the comment resource"
        print "  posting the test movie for the comment"
        r = self.app.post('/mdbst/api/movies/',
                          data=json.dumps(self.test_movie),
                          headers={'content-type':'application/json'})
        self.assertEqual(r.status_code, 201)
        movie_url = r.headers['location']
        print "  posting a test comment"
        r = self.app.post(movie_url+'comments/',
                          data=json.dumps(self.test_comment),
                          headers={'content-type':'application/json'})
        self.assertEqual(r.status_code, 201)
        comment_url = r.headers['location']
        print "  sending get request to get the comment"
        r = self.app.get(comment_url)
        self.assertEqual(r.status_code, 200)

        print "  sending put request to the new comment"
        r = self.app.put(comment_url,
                         data=json.dumps(self.test_comment),
                         headers={'content-type':'application/json'})
        self.assertEqual(r.status_code, 204)
        
        print "  deleting the test comment"
        r = self.app.delete(comment_url)
        print "  checking if the test comment still exists"
        r = self.app.get(comment_url)
        self.assertEqual(r.status_code, 404)
        print "  deleting the test_movie"
        r = self.app.delete(movie_url)
        self.assertEqual(r.status_code, 204)
        
        
if __name__ == "__main__":
    print "starting the test"
    unittest.main()
