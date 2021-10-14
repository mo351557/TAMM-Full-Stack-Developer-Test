require('rootpath')();
/* Required imports */
import express, { Application, Request, Response, NextFunction, Router } from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import cors from 'cors';
import fs from 'fs';

/* Declaration merging on express-session*/
declare module "express-session" {
    interface Session {
      email: string;
    }
}

/* options object with corsOptions type for configuring cors*/
const options: cors.CorsOptions = {
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'X-Access-Token',
      'x-xsrf-token'
    ],
    credentials: true,
    methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
    origin: '*',
    preflightContinue: false,
};

const router: Router = express.Router();
const app: Application = express();

app.use(
    session({ secret: 'test_secret', saveUninitialized: true, resave: true })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/views'));

app.use(cors(options));

let userSession: session.Session;

/* Function to create session for authentication of the user */
const authenticateUser = (req: Request,res: Response, next: NextFunction) => {
    if (req.session.email !== undefined) {
      console.log('User is authenticated!');
      next();
    } else {
      console.log('Unauthorised access!');
      res.write('<h3>Please login to access feature.</h3>');
      res.end('<a href=' + '/login' + '>Login</a>');
    }
}

router.get('/', (req: Request,res: Response, next: NextFunction) => {
    userSession = req.session;
    if (userSession.email) {
      return res.redirect('/api/');
    }
    res.sendFile('index.html');
});

router.post('/login', (req: Request,res: Response) => {
    userSession = req.session;
    userSession.email = req.body.email;
    res.end('done');
});
  
router.get('/api/*', authenticateUser, (req: Request,res: Response, next: NextFunction) => {
    res.write(`<h1>Hello ${userSession.email} </h1><br>`);
    res.write(`<h1>Open Postman and browse '/save/:id' with post method 
      and pass some Json to store request.</h1><br>`);
    res.end('<a href=' + '/logout' + '>Logout</a>');
    next();
});
  
router.get('/pub/*', authenticateUser, (req: Request,res: Response, next: NextFunction) => {
    res.write(`<h1>Hello ${userSession.email} </h1><br>`);
    res.write(`<h1>Open Postman and browse '/save/:id' with post method 
      and pass some Json to store file</h1><br>`);
    res.end('<a href=' + '/logout' + '>Logout</a>');
    next();
});
  
router.get('/data', (req: Request,res: Response, next: NextFunction) => {
    res.end(`<h1>Your are accessing  ${req.url} route</h1><br>`);
});
  
router.post('/save/:id', function (req: Request,res: Response) {
    if (!fs.existsSync(`${__dirname}/data`)) {
      fs.mkdirSync(`${__dirname}/data`);
    }
    fs.writeFile(
      `${__dirname}/data/${req.params.id}.json`,
      JSON.stringify(req.body),
      (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
        res.status(201).json('The file has been saved!');
      }
    );
});
  
router.get('/save/:id', (req: Request,res: Response, next: NextFunction) => {
    let data = fs.readFileSync(`${__dirname}/data/${req.params.id}.json`);
    res.status(200).json(JSON.parse(data.toString()));
});
  
router.get('/logout', (req: Request,res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return console.log(err);
      }
      res.redirect('/');
    });
});

app.use('/', router);

app.listen(process.env.PORT || 3000, () => {
    console.log(`App Started on PORT ${process.env.PORT || 3000}`);
});
