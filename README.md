##CONNEKT CAMP 

#API'S 

1.course API
//get all course

url:{BASE_URL}/courses
request_type: GET 
query_parameters:{ course_name, username }

2.person API's 

//get person 
 i.url:{BASE_URL}/person 
   request_type:GET
   query_parameters:{username/userId/email}

//update person data
 ii.url:{BASE_URL}/person/:username
    request_type:PUT
    payload:req.body 

 //set person data
 iii.url:{BASE_URL}/person
     request_type:POST
     payload:req.body

 //is username unique
 iv.url:{BASE_URL}/is-username-unique
    request_type:GET
    query_parameters:username

3.subscriptions API
// 
