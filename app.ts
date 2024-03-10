import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const app: Express = express();
const port = 4002;

app.use(cors());

// JSON 형식의 요청을 파싱하는 미들웨어
app.use(express.json());
// URL-encoded 형식의 요청을 파싱하는 미들웨어
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
    res.send('Typescript + Node.js + Express Server');
});

app.post('/answer/:chapter', async (req: Request, res: Response) => {

    const url: string = `http://${process.env.ELASTICSEARCH_SERVER}/${process.env.ELASTICSEARCH_INDEX}/_search`
    const auth: string = process.env.ELASTICSEARCH_ID + ":" + process.env.ELASTICSEARCH_PWD;
    const authorization: string = Buffer.from(auth, "utf8").toString("base64");
    const options = {
        url,
        method: "POST",
        headers: {
            Authorization: "Basic " + authorization,
            "Content-Type": "application/json",
        },
        data: req.body
    };


    const response = await axios(options);


    res.send(response.data);
});

app.listen(port, () => {
    console.log(`running http://localhost:${port}`);
});