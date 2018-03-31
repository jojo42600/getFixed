// require('dotenv').config();
const express = require('express');
const path = require('path');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const cloudinary = require('cloudinary');
const multer = require('multer');
const PubSub = require('graphql-subscriptions');

// GraphQL modules
const graphQLTools = require('graphql-tools');
const graphQLExp = require('apollo-server-express');
// const graphQLSchema = require('./graphQL/schema.js');
const cors = require('cors');
const { execute, subscribe } = require('graphql');
const { createServer } = require('http');
const { SubscriptionServer } = require('subscriptions-transport-ws');

const settings = require('./../config/.cloudinary.js');

const app = express();
const router = require('./router/index.js');

const db = require('./database/index.js');

const PORT = process.env.PORT || 8080;

app.enable('trust proxy');

app.use((req, res, next) => {
  if (req.secure || req.headers.host === 'localhost:8080') {
    next();
  } else {
    res.redirect(`https://${req.headers.host}${req.url}`);
  }
});


const typeDefs = `
  type Query {
    user(id: String!): User
    allUsers: [User]
    listing(id: String!): Listing
    allListings(category: String): [Listing]
  }

  type User {
    id: String
    username: String
    email: String
    avg_rating: String
    rating_count: Int
    city: String
    phone_number: String
    num: String
  }

  type Listing {
    id: String
    user_id: String
    title: String
    description: String
    category: String
    location: String
    image: String
  }

  type Mutation {
    createUser(username: String!, email: String!, password: String!): User!
    createListing(title: String!, description: String!, category: String!, location: String!): Listing!
    deleteUser(id: String!): User
    deleteListing(id: String!): Listing
  }

  type Subscription {
    listingAdded: Listing
  }
`;

const pubsub = new PubSub.PubSub();

const root = {
  user: (obj, args, context) => {
    return db.users.find({
      where: obj
    });
  },
  allUsers: (obj, args, context) => {
    return db.users.findAll();
  },
  listing: (obj, args, context) => {
    return db.listings.find({
      where: obj
    });
  },
  allListings: (obj, args, context) => {
    return db.listings.findAll({
      where: obj,
      limit: 25
    });
  },
  createUser: (obj, args, context) => {
    return db.users.create(obj);
  },
  createListing: (obj, args, context) => {
    let newListing = db.listings.create(obj);
    pubsub.publish('listingAdded', { listingAdded: newListing });
    return newListing;
  },
  listingAdded: {
    subscribe: () => pubsub.asyncIterator('listingAdded')
  },
  deleteUser: (obj, args, context) => {
    return db.users.destroy({
      where: obj
    });
  },
  deleteListing: (obj, args, context) => {
    return db.listings.destroy({
      where: obj
    })
  }
}

// GraphQL
// const typeDefs = graphQLSchema.typeDefs;
// const resolvers = graphQLSchema.resolvers;
const schema = graphQLTools.makeExecutableSchema({ typeDefs });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
require('./passport/passport.js')(passport, db.users);


app.use(express.static(path.join(__dirname, '../client/dist')));

const authRoute = require('./router/routes/auth.js')(app, db, passport);

app.use('*', cors({ origin: `http://localhost:${PORT}` }));
app.use('/graphql', bodyParser.json(), graphQLExp.graphqlExpress({ schema, rootValue: root, graphiql: true }));
app.use('/graphiql', graphQLExp.graphiqlExpress({
  endpointURL: '/graphql',
  subscriptionsEndpoint: `ws://localhost:${PORT}/subscriptions`
}));

const ws = createServer(app);

const storage = multer.memoryStorage();
const upload = multer({ storage });
cloudinary.config(settings);

app.post('/api/cloudinaryUpload', upload.single('problemImage'), (req, res) => {
  cloudinary.uploader.upload_stream((result) => {
    res.status(200).send(result);
  }).end(req.file.buffer);
});

router(app, db);

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

db.sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

db.sequelize.sync()
  .then(() => {
    ws.listen(PORT, () => {
      console.log(`Apollo Server is now running on http://localhost:${PORT}`);
      new SubscriptionServer({
        execute,
        subscribe,
        schema
      }, {
        server: ws,
        path: '/subscriptions',
      });
    })
  })
  .catch(err => console.log(err));

