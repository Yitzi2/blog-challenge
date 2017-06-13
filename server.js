const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const {BlogPosts} = require('./models');

const jsonParser = bodyParser.json();
const app = express();

//Morgan to log HTTP
app.use(morgan('common'));

BlogPosts.create('First post', 'Hi, this is my blog', 'me', '1/1/2000');
BlogPosts.create('Second post', 'Coming up with posts is the hardest part of this project', 'me', '1/2/2000');
BlogPosts.create('Last post', 'So this is the last one', 'me', '1/3/2000');

app.get('/blog-posts', (req, res) => {
  res.json(BlogPosts.get());
});

app.post('/blog-posts', jsonParser, (req, res) => {
  // ensure 'title', 'content' and 'author' are in request body.  publishDate is automatically time of submission.
  const requiredFields = ['title', 'content', 'author'];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`
      console.error(message);
      return res.status(400).send(message);
    }
  }

  const post = BlogPosts.create(req.body.title, req.body.request, req.body.author);
  res.status(201).json(post);
});

app.put('/blog-posts/:id', jsonParser, (req, res) => {
  const requiredFields = ['title', 'content', 'author'];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`
      console.error(message);
      return res.status(400).send(message);
    }
  }
  console.log(`Updating post \`${req.params.id}\``);
  try {
  	BlogPosts.update({
    	id: req.params.id,
    	title: req.body.title,
    	content: req.body.content,
    	author: req.body.author
  	}); //PublishDate cannot be overwritten on update.
  	res.status(204).end();
  }
  catch (exception) {
  	if (exception.name !== "StorageException") throw exception;
  	const {message} = exception;
    console.error(message);
    return res.status(400).send(message);  
  }
});

// when DELETE request comes in with an id in path,
// try to delete that item from ShoppingList.
app.delete('/blog-posts/:id', (req, res) => {
  BlogPosts.delete(req.params.id);
  console.log(`Deleted post \`${req.params.ID}\``);
  res.status(204).end();
});

app.listen(process.env.PORT || 8080, () => {
  console.log(`Your app is listening on port ${process.env.PORT || 8080}`);
});