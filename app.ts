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

app.get('/learn-es7/', (req: Request, res: Response) => {
    res.send('Typescript + Node.js + Express Server');
});

app.post('/learn-es7/answer/:chapter', async (req: Request, res: Response) => {

    try {

        const url: string = `http://${process.env.ELASTICSEARCH_SERVER}/${process.env.ELASTICSEARCH_INDEX}/_search`
        const auth: string = process.env.ELASTICSEARCH_ID + ":" + process.env.ELASTICSEARCH_PWD;
        const authorization: string = Buffer.from(auth, "utf8").toString("base64");

        console.log(url);

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

        const isCorrect = gradingResult(Number(req.params.chapter), response.data, req.body)

        console.log("isCorrect  : ", isCorrect);

        res.json({ isCorrect, elasticRes: response.data });
    } catch (error) {
        if (error instanceof Error) {
            // error가 Error 객체의 인스턴스인 경우에만 message에 접근
            console.log(error.message);
        } else {
            console.log(error);
        }

        res.status(400);
        res.json({ isCorrect: false, elasticRes: {} });
    }
});
interface ESdata {
    "category"?: string[]
    "currency"?: string,
    "customer_first_name"?: string,
    "customer_full_name"?: string,
    "customer_gender"?: string,
    "customer_id"?: number,
    "customer_last_name"?: string,
    "customer_phone"?: string,
    "day_of_week"?: string,
    "day_of_week_i"?: number,
    "email"?: string,
    "manufacturer"?: string[],
    "order_date"?: string,
    "order_id"?: number,
    "products"?: product[],
    "sku"?: string[],
    "taxful_total_price": number,
    "taxless_total_price"?: number,
    "total_quantity"?: number,
    "total_unique_products"?: number,
    "type"?: string,
    "user"?: string,
    "geoip"?: {
        "country_iso_code"?: string,
        "location"?: {
            "lon"?: number,
            "lat"?: number
        },
        "region_name"?: string,
        "continent_name"?: string,
        "city_name"?: string
    },
    "event"?: {
        "dataset"?: string
    }
}

interface product {
    "base_price"?: number,
    "discount_percentage"?: number,
    "quantity"?: number,
    "manufacturer"?: string,
    "tax_amount"?: number,
    "product_id"?: number,
    "category"?: string
    "sku"?: string,
    "taxless_price"?: number,
    "unit_discount_amount"?: number,
    "min_price"?: number,
    "_id"?: string,
    "discount_amount"?: number,
    "created_on"?: string,
    "product_name"?: string,
    "price"?: number,
    "taxful_price"?: number,
    "base_unit_price"?: number
}

interface EsRes {
    hits: {
        hits: { _source: ESdata }[]
    }
}
interface EsQuery {
    query: object,
    from: number,
    size: number
}
const gradingResult = (chapter: number, data: EsRes, parseQuery: EsQuery): boolean => {
    if (data?.hits?.hits?.length === 0 && chapter < 16) {
        return false;
    }
    const dataList = data?.hits?.hits.map((v: { _source: ESdata }) => v._source);
    // 각 챕터에 맞는 데이터를 가져왔는지 확인후 채점
    if (chapter === 1) {
        return true;
    } else if (chapter === 2) {
        // match 쿼리로 customer_full_name 필드가 'Bailey'인 문서를 검색하세요.
        return dataList.every((data: ESdata): boolean => !!data?.customer_full_name?.includes("Bailey"));
    } else if (chapter === 3) {
        //customer_full_name.keyword를 이용하여 customer_full_name 필드가 Eddie Underwood인 문서를 검색하세요.
        return !!dataList.find((data: ESdata): boolean => data.customer_full_name === "Eddie Underwood");
    } else if (chapter === 4) {
        //taxful_total_price 필드의 값이 100 이상인 문서를 검색하세요.
        return dataList.every((data: ESdata): boolean => data.taxful_total_price > 100);
    } else if (chapter === 5) {
        //customer_full_name 필드에서 'Mary'가 포함되어 있으면서 'Bailey'는 포함되지 않는 문서를 검색하세요.
        return dataList.every((data: ESdata): boolean => !!(data?.customer_full_name?.includes("Mary") && !data.customer_full_name.includes("Bailey")));
    } else if (chapter === 6) {
        //email 필드의 값이 정확히 'gwen@butler-family.zzz'이면서 taxful_total_price 필드 값이 100 이상인 문서를 검색하세요.
        return dataList.every((data: ESdata): boolean => data.taxful_total_price > 100 && data.email === "gwen@butler-family.zzz");
    } else if (chapter === 7) {
        //1. customer_full_name 필드 값이 Oliver Rios 이거나
        //2. day_of_week 필드값이 'Monday'이거나
        //3. taxful_total_price 필드의 값이 1000 초과
        //위 조건중 2개이상을 만족하는 문서를 검색하세요.
        return dataList.every((data: ESdata): boolean => {
            let conut = 0;

            if (data.customer_full_name === "Oliver Rios") {
                conut += 1;
            }
            if (data.day_of_week === "Monday") {
                conut += 1;
            }
            if (data.taxful_total_price > 1000) {
                conut += 1;
            }
            console.log(conut);


            if (conut >= 2) {
                return true;
            } else {
                return false;
            }
        });
    } else if (chapter === 9) {
        // manufacturer 필드의 값이 'Elitelligence' 또는 'Pyramidustries'인 문서를 검색하세요
        return dataList.every((data: ESdata): boolean => !!(data?.manufacturer?.includes("Elitelligence") || data?.manufacturer?.includes("Pyramidustries")));
    } else if (chapter === 10) {
        // user 필드의 값이 'r'로 시작하면서 중간에 'bb'가 들어간 문서를 검색하세요
        return dataList.every((data: ESdata): boolean => /^r.*bb.*$/.test(data.user as string));
    } else if (chapter === 11) {
        // >email 필드가 있는 문서를 검색하세요.
        return dataList.every((data: ESdata): boolean => Object.hasOwnProperty.call(data, "email"));
    } else if (chapter === 12) {
        // 'customer_first_name', 'customer_last_name', 'email' 필드 중에서 'Eddie' 값을 포함하는 문서를 검색하세요.
        return dataList.every((data: ESdata): boolean => !!(data.customer_first_name?.includes("Eddie") || data.customer_last_name?.includes("Eddie") || data.email?.includes("Eddie")));
    } else if (chapter === 13) {
        // 6번째 문서부터 30개의 문서를 검색하세요.
        return parseQuery.from === 5 && parseQuery.size === 30;
    } else if (chapter === 14) {
        // customer_으로 시작하는 필드는 포함하지만, _id로 끝나는 필드는 검색결과에 포함되지 않도록 검색하세요
        return dataList.every((data: ESdata): boolean => {
            const fields = Object.keys(data);
            if (fields.length === 0) {
                return false;
            }
            if (fields.every(field => /^customer_/.test(field) && !/_id$/.test(field))) {
                return true;
            } else {
                return false;
            }
        });
    } else if (chapter === 15) {
        // order_date 필드를 기준으로 내림차순으로 정렬해서 검색하세요.
        for (let i = 0; i < dataList.length - 1; i++) {
            const currentDate = dataList[i].order_date ?? "";
            const nextDate = dataList[i + 1].order_date ?? "";

            if (currentDate < nextDate) {
                return false;  // 내림차순이 아니면 false 반환
            }
        }
        return true;
    } else if (chapter === 16 || chapter === 17 || chapter === 18) {
        // 챕터 16부터는 문제가 아니라 기능설명이여서 채점과정 x
        return true;
    }
    return false;
};
app.listen(port, () => {
    console.log(`running http://localhost:${port}`);
});