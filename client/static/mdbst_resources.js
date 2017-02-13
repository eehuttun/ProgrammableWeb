
/**** START CONSTANTS****/
//True or False
var DEBUG = true,
COLLECTIONJSON = "application/vnd.collection+json"
HAL = "application/hal+json"
MOVIE_PROFILE = "http://atlassian.virtues.fi:8090/display/PWP/PWP04#PWP04-MDbST_Movie"
DIRECTOR_PROFILE = "http://atlassian.virtues.fi:8090/display/PWP/PWP04#PWP04-MDbST_Director"
COMMENT_PROFILE = "http://atlassian.virtues.fi:8090/display/PWP/PWP04#PWP04-MDbST_Comment"
DEFAULT_DATATYPE = "json"
/**** END CONSTANTS****/

/* Gets the movie data and extracts it into the web page */
function getMovie(apiurl) {
	return $.ajax({
		url: apiurl,
		dataType:DEFAULT_DATATYPE
	}).done(function (data, textStatus, jqXHR){
		if (DEBUG) {
			console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus);
		}
		
		//Extract movie information
		var movie_links = data._links;
		var directors = movie_links.directors;
		var self = movie_links.self.href;

		for (var j=0; j<directors.length;j++){
			appendDirectorToList(directors[j].href);			
		}
		var rating = data.average_rating;
		
		if (rating == 0) {
			$("#rating").html("Rating: not rated yet");
		}
		else {
			$("#rating").html("Rating: "+data.average_rating);
		}
		
		$("#movieHeader").html('<h1>'+data.title+'</h1>');
		
		$("#description").html(data.description);
		$("#image").html('<img src=' + data.cover_url + '>');
		$("form#movie_edit_form").attr("action",self);
		$("form#movie_delete_form").attr("action",self);
		$("form#rating_form").attr("action",self);
		$("form#commentBox").attr("action",self+"comments/");


	}).fail(function (jqXHR, textStatus, errorThrown){
		if (DEBUG) {
			console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown);
		}
		alert ("Cannot extract information about this movie from the MDbST service.");
	});
}

/* gets the movie data for rating purposes */
function getMovieForRating(apiurl) {
	$.ajax({
		url: apiurl,
		dataType:DEFAULT_DATATYPE
	}).done(function (data, textStatus, jqXHR){
		if (DEBUG) {
			console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus);
		}
		
		//handle the ratings with the data
		handleRatings(apiurl, data);
		
		
	}).fail(function (jqXHR, textStatus, errorThrown){
		if (DEBUG) {
			console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown);
		}
		alert ("Cannot extract information about this movie from the MDbST service.");
	});
}

function getMovieForm(apiurl) {
	return $.ajax({
		url: apiurl,
		dataType: DEFAULT_DATATYPE
	}).done(function (data, textStatus, jqXHR){
		if (DEBUG) {
			console.log ("RECEIVED RESPONSE GETMOVIEEDITFORM: data:",data,"; textStatus:",textStatus)
		}
		$form = createFormFromTemplate (data._links.self.href, 
			                            data.template,
			                            "edit_movie_form","Edit",
										"#editMovieForm",
			                            handleEditMovie);
		$("#editMovieForm").empty();
		$("#editMovieForm").append($form);
 		$("#editMovieForm").show();
	}).fail(function (jqXHR, textStatus, errorThrown){
		if (DEBUG) {
			console.log ("RECEIVED ERROR GETMOVIESFORM: textStatus:",textStatus, ";error:",errorThrown)
		}
		//Inform user about the error using an alert message.
		alert ("Could not create a link to edit the movie.  Please, try again");
	});
}

function getComments(apiurl) {
	return $.ajax({
		url: apiurl,
		dataType:DEFAULT_DATATYPE
	}).always(function(){
		$("#comments_list").empty();

	}).done(function (data, textStatus, jqXHR){
		if (DEBUG) {
			console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus)
		}
		//Extract the movies
    	comments = data.collection.items;
		for (var i=0; i < comments.length; i++){
			var comment = comments[i];

			var comment_data = comment.data;
			
			appendCommentToList(comment.href, comment_data[0].author_nickname, comment_data[0].comment);

		}
	}).fail(function (jqXHR, textStatus, errorThrown){
		if (DEBUG) {
			console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown)
		}
		//Inform user about the error using an alert message.
		alert ("Could not fetch the list of comments.  Please, try again");
	});
}


function getDirector(apiurl) {
	return $.ajax({
		url: apiurl,
		dataType:DEFAULT_DATATYPE, 

	}).done(function (data, textStatus, jqXHR){
		if (DEBUG) {
			console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus)
		}
		
		var director_links = data._links;
		var directed = data.directed;
        var self = director_links.self.href;
		
		for (var j=0; j<directed.length;j++){
			appendMovieToList(directed[j].id, directed[j].title);			
		}
		
		$("#directorHeader").html('<h2>'+data.name+'</h2>');
		$("#description").html(data.biography[0]);
		$("form#director_edit_form").attr("action",self);
		$("form#director_delete_form").attr("action",self);

	}).fail(function (jqXHR, textStatus, errorThrown){
		if (DEBUG) {
			console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown)
		}
		//Show an alert informing that I cannot get info from the user.
		alert ("Cannot extract information about this director from the MDbST service.")
	});
}

function getDirectorForm(apiurl) {
	return $.ajax({
		url: apiurl,
		dataType: DEFAULT_DATATYPE
	}).done(function (data, textStatus, jqXHR){
		if (DEBUG) {
			console.log ("RECEIVED RESPONSE GETMOVIEEDITFORM: data:",data,"; textStatus:",textStatus)
		}
		$form = createFormFromTemplate (data._links.self.href, 
			                            data.template,
			                            "edit_director_form","Edit",
										"#editDirectorForm",
			                            handleEditDirector);
		$("#editDirectorForm").empty();
		$("#editDirectorForm").append($form);
 		$("#editDirectorForm").show();
	}).fail(function (jqXHR, textStatus, errorThrown){
		if (DEBUG) {
			console.log ("RECEIVED ERROR GETMOVIESFORM: textStatus:",textStatus, ";error:",errorThrown)
		}
		//Inform user about the error using an alert message.
		alert ("Could not create a link to edit the director.  Please, try again");
	});
}


function deleteDirector(apiurl){
	$.ajax({
		url: apiurl,
		type: "DELETE",
		dataType:DEFAULT_DATATYPE

	}).done(function (data, textStatus, jqXHR){
		if (DEBUG) {
			console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus)
		}
		alert("Director deleted");
		window.open("/client/ui.html", "_self")


	}).fail(function (jqXHR, textStatus, errorThrown){
		if (DEBUG) {
			console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown)
		}
		alert("Error: director was not deleted");
	});
}

function editDirector(apiurl,template){
	edit = JSON.stringify(template);
	$.ajax({
		url: apiurl,
		type: "PUT",
		data: edit,
		processData:false,
		contentType: "application/json"

	}).done(function (data, textStatus, jqXHR){
		if (DEBUG) {
			console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus)
		}
		location.reload(true);


	}).fail(function (jqXHR, textStatus, errorThrown){
		if (DEBUG) {
			console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown)
		}
		alert("Error: director could not be edited");

	});
}

function deleteMovie(apiurl){
	$.ajax({
		url: apiurl,
		type: "DELETE",
		dataType:DEFAULT_DATATYPE

	}).done(function (data, textStatus, jqXHR){
		if (DEBUG) {
			console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus)
		}
		alert("Movie deleted");
		window.open("/client/ui.html", "_self")


	}).fail(function (jqXHR, textStatus, errorThrown){
		if (DEBUG) {
			console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown)
		}
		alert("Error: movie was not deleted");
	});
}

function editMovie(apiurl,template){
	edit = JSON.stringify(template);
	$.ajax({
		url: apiurl,
		type: "PUT",
		data: edit,
		processData:false,
		contentType: "application/json"

	}).done(function (data, textStatus, jqXHR){
		if (DEBUG) {
			console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus)
		}
		location.reload(true);


	}).fail(function (jqXHR, textStatus, errorThrown){
		if (DEBUG) {
			console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown)
		}
		alert("Error: movie could not be edited");

	});
}

function editRating(apiurl, template) {
	edit = JSON.stringify(template);
	$.ajax({
		url: apiurl,
		type: "PUT",
		data: edit,
		processData:false,
		contentType: "application/json"

	}).done(function (data, textStatus, jqXHR){
		if (DEBUG) {
			console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus)
		}
		alert("rating processed");
		location.reload(true);


	}).fail(function (jqXHR, textStatus, errorThrown){
		if (DEBUG) {
			console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown)
		}
		alert("Error: movie could not be edited");

	});
}

function addComment(apiurl, comment){
	comment = JSON.stringify(comment);
	$.ajax({
		url: apiurl,
		type: "POST",
		data:comment,
		processData:false,
		contentType: "application/json",
	}).done(function (data, textStatus, jqXHR){
		if (DEBUG) {
			console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus)
		}
		alert ("Comment successfully added");
		location.reload(true);
	}).fail(function (jqXHR, textStatus, errorThrown){
		if (DEBUG) {
			console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown)
		}
		alert ("Could not create new comment");
	});
}

function editComment(apiurl, template) {
	newComment = JSON.stringify(template);
	$.ajax({
		url: apiurl,
		type: "PUT",
		data: newComment,
		processData:false,
		contentType: "application/json",
	}).done(function (data, textStatus, jqXHR){
		if (DEBUG) {
			console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus)
		}
		alert ("Comment successfully edited");
		location.reload(true);
	}).fail(function (jqXHR, textStatus, errorThrown){
		if (DEBUG) {
			console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown)
		}
		alert ("Could not edit the comment");
	});
}

function deleteComment(comment_url) {
	$.ajax({
	url: comment_url,
	type: "DELETE",
	dataType:DEFAULT_DATATYPE
	}).done(function (data, textStatus, jqXHR){
		if (DEBUG) {
			console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus)
		}
		alert("Comment deleted");
		location.reload(true);

	}).fail(function (jqXHR, textStatus, errorThrown){
		if (DEBUG) {
			console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown)
		}
		alert("Error: comment was not deleted");



	});
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
		
	
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

/**** END RESTFUL CLIENT****/


/**** BUTTON HANDLERS ****/

function handleEditMovie(event) {
	if (DEBUG) {
		console.log ("Triggered handleEditMovie")
	}
	event.preventDefault();
	var $form = $(this);
	var template = serializeFormTemplate($form);
	var url = $form.attr("action");
	editMovie(url, template);
	return false; //Avoid executing the default submit
}

function handleEditMovieForm(event) {
	if (DEBUG) {
		console.log ("Triggered handleEditMovieForm")
	}
	var apiurl = $(this).closest("form").attr("action");
	getMovieForm(apiurl);
	return false;
}

function handleDeleteMovie(event){
	if (DEBUG) {
		console.log ("Triggered handleDeleteMovie")
	}
	var movieUrl = $(this).closest("form").attr("action");
	
	deleteMovie(movieUrl);
}

function handleCreateComment(event){
	if (DEBUG) {
		console.log ("Triggered handleCreateComment")
	}
	event.preventDefault();
	var $form = $(this).closest("form");
	$nickname = $form.children("input[name=nickname]");
	$comment = $form.children("input[name=comment]");
	var nickname = $nickname.val();
	var comment = $comment.val();

	var template = {'template':{
								'data':[]
	}};
	var _data = {};
	_data.name = "author_nickname";
	_data.value = nickname;
	template.template.data.push(_data);
	
	var _data = {};
	_data.name = "comment";
	_data.value = comment;
	template.template.data.push(_data);
	
	var url = $form.attr("action");
	addComment(url, template);
	return false; //Avoid executing the default submit
}

function handleEditComment(event) {
	if (DEBUG) {
		console.log ("Triggered editComment")
	}
	event.preventDefault();
	var $form = $(this).closest("form");
	var template = serializeFormTemplate($form);
	var url = $form.attr("action");
	editComment(url, template);
	return false; //Avoid executing the default submit
}

function handleEditCommentForm(button) {
	if (DEBUG) {
		console.log ("Triggered handleEditComment")
	}
	event.preventDefault();
	var comment_url = button.name;
	//get the comment id
	var comment_id = comment_url.split('/');
	comment_id = comment_id[comment_id.length-2];
	
	$form=$('<form style="clear:left"></form>');
	$form.attr("id", comment_id);
	$form.attr("action",comment_url);
	$label = $('<label>New nickname</label>')
	$form.append($label);
	$input = $('<input type="text" style="display:block"></input>');
	$input.attr('name', "author_nickname");
	$input.prop('required',true);
	$form.append($input);
	$label = $('<label>New comment</label>')
	$form.append($label);
	$input = $('<input type="text" style="display:block"></input>');
	$input.attr('name', "comment");
	$input.prop('required',true);
	$form.append($input);
	$button = $('<button type="submit" style="display:block"></button>');
	$button.text("Submit");
	$form.append($button);
	$form.submit(handleEditComment);
	
	$("#edit_comment_"+comment_id).append($form);
	return false;
}

function handleDeleteComment(button) {
	if (DEBUG) {
		console.log ("Triggered handleDeleteComment")
	}
	event.preventDefault();
	var comment_url = button.name;
	deleteComment(comment_url);
	return false;
}

function handleGetMovie(event) {
	if (DEBUG) {
		console.log ("Triggered handleGetMovie")
	}
	event.preventDefault();
	
	var url = $(this).attr("href");
	var components = url.split("/");
	var id = components[4];
	
	window.open("/client/movies.html?id="+id,"_self")


	return false;
}

function handleGetDirector(event) {
	if (DEBUG) {
		console.log ("Triggered handleGetDirector")
	}
	event.preventDefault();
	
	var url = $(this).attr("href");
	var components = url.split("/");
	var id = components[4];
	
	window.open("/client/directors.html?id="+id,"_self")


	return false; //IMPORTANT TO AVOID <A> DEFAULT ACTIONS
}

function handleDeleteDirector(event){
	if (DEBUG) {
		console.log ("Triggered handleDeleteDirector")
	}
	var directorUrl = $(this).closest("form").attr("action");
	
	deleteDirector(directorUrl);
}

function handleEditDirectorForm(event) {
	if (DEBUG) {
		console.log ("Triggered handleEditDirectorForm")
	}
	var apiurl = $(this).closest("form").attr("action");
	getDirectorForm(apiurl);
	return false;
}

function handleEditDirector(event) {
	if (DEBUG) {
		console.log ("Triggered handleEditDirector")
	}
	event.preventDefault();
	var $form = $(this);
	var template = serializeFormTemplate($form);
	var url = $form.attr("action");
	editDirector(url, template);
	return false; //Avoid executing the default submit
}

function handleSubmitRating(event) {
	if (DEBUG) {
		console.log ("Triggered handleSubmitRating")
	}
	event.preventDefault();
	var apiurl = $(this).closest("form").attr("action");
	getMovieForRating(apiurl);
	
	return false;
}
// creates a template with unchanged movie data expect rating values
function handleRatings(apiurl, _data) {
	if (DEBUG) {
		console.log ("Triggered handleRatings")
	}
	var rating_value = $('input[name="newRating"]:checked').val();
	
	//process the new rating value and increment number of votes
	var new_rating = {};
	new_rating.average_score = parseInt(_data.average_rating)*parseInt(_data.number_of_ratings)+parseInt(rating_value);
	new_rating.total_number = parseInt(_data.number_of_ratings+1);
	new_rating.average_score = new_rating.average_score/new_rating.total_number;
	var envelope={"template":{
								"data":[]
	}};
	envelope.template.data.push({"name" : "title",   	 "value" : _data.title });
	envelope.template.data.push({"name" : "imdb_id", 	 "value" : _data.imdb_id });
	envelope.template.data.push({"name" : "description", "value" : _data.description });
	envelope.template.data.push({"name" : "year",		 "value" : _data.year });
	envelope.template.data.push({"name" : "rating", 	 "value" : new_rating });
	editRating(apiurl, envelope);
	return false;
}

function serializeFormTemplate($form){
	var envelope={"template":{
								"data":[]
	}};
	// get all the inputs into an array.
    var $inputs = $form.children("input");
    $inputs.each(function(){
    	var _data = {};
		/* 
		Biography must be inside brackets.
		To not complicate the input forms the biography is modified here.
		*/
		if(this.name == "biography" || this.name == "director_name") {
			var _value = [];
			_value[0] = {"name" : $(this).val()};
			_data.name = this.name;
			_data.value = _value;
			envelope.template.data.push(_data);
			console.log($(this).val());
		}
		else {
			_data.name = this.name;
			_data.value = $(this).val();
			envelope.template.data.push(_data);
		}
    });
    return envelope;

}
/**** END BUTTON HANDLERS ****/

/**** UI HELPERS ****/
function appendDirectorToList(apiurl) {
	return $.ajax({
		url: apiurl,
		dataType:DEFAULT_DATATYPE, 
	}).done(function (data, textStatus, jqXHR){
		if (DEBUG) {
			console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus)
		}
		var director_links = data._links;
		var self = director_links.self.href;
		var name = data.name;
		var $director = $('<li>').html('<a class= "user_link" href="'+self+'">'+name+'</a>');
        
		
		$("#director_list").append($director);

	}).fail(function (jqXHR, textStatus, errorThrown){
		if (DEBUG) {
			console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown)
		}
		//Show an alert informing that I cannot get info from the user.
		alert ("Cannot extract information about this director from the MDbST service.")
	});
}

function appendCommentToList(url, nickname, comment) {
	//get the comment id
	var comment_id = url.split('/');
	comment_id = comment_id[comment_id.length-2];
	//append the comment to the list
	var $comment_to_add = $('<li>').html('<p><b>'+nickname+'</b></p><p>'+comment+'</p>');
	$("#comments_list").append($comment_to_add);
	
	//add edit comment button
	var $edit_comment = $('<input type="button" name='+url+' onClick="handleEditCommentForm(this)" value="Edit comment" style="float:left">');
	$("#comments_list").append($edit_comment);
	
	//add delete comment button
	var $delete_comment = $('<input type="button" name='+url+' onClick="handleDeleteComment(this)" value="Delete comment" style="float:left"><br>');
	$("#comments_list").append($delete_comment);
	
	//add div for the editing form
	var $edit_div = $('<div id="edit_comment_'+comment_id+'"></div>');
	$("#comments_list").append($edit_div);
	
	return $comment_to_add;
}
function appendMovieToList(id, title) {
	var url = "/mdbst/api/movies/"+id;
	var $movie = $('<li>').html('<a class= "user_link" href="'+url+'">'+title+'</a>');

	$("#directed_list").append($movie);
	return $movie;
}
/*
Creates a form from the given template 
*/
function createFormFromTemplate(url,template,id,button_name,div_name,handler){
	$form=$('<form></form>');
	$form.attr("id",id);
	$form.attr("action",url);
	if (template.data) {
		for (var i =0; i<template.data.length; i++){
			var name = template.data[i].name;
			var id = name+"_id";
			var value = template.data[i].value;
			var prompt = template.data[i].prompt;
			var required = template.data[i].required;
			$input = $('<input type="text"></input>');
			$input.addClass("editable");
			$input.attr('name',name);
			$input.attr('id',id);
			if(value){
				$input.attr('value', value);
			}
			if(prompt){
				$input.attr('placeholder', prompt);
			}
			if(required){
				$input.prop('required',true);
			}
			$label_for = $('<label></label>')
			$label_for.attr("for",id);
			if(required) {
				$label_for.text(name + '*');
			}
			else {
				$label_for.text(name);
			}
			$form.append($label_for);
			$form.append($input);
		}
		$text = $('<p>*these fields are required</p>');
		$form.append($text);
		if (button_name) { 
			$button = $('<button type="submit"></button>');
			$button.attr("id",button_name);
			$button.attr("value",button_name);
			$button.text(button_name);
			$form.append($button);
			$form.submit(handler);
		}
		$button = $('<button type="button">Cancel</button>');
		$button.attr("id", "close_button");
		$button.click(function() {$(div_name).hide();});
		$form.append($button);
	}
	return $form;
}

