// =========================
// server.js
// =========================

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Razorpay = require("razorpay");
const path = require("path");
const multer = require("multer");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");
const { OAuth2Client } =
require("google-auth-library");

dotenv.config();
const razorpay = new Razorpay({

    key_id: process.env.RAZORPAY_KEY_ID,

    key_secret: process.env.RAZORPAY_KEY_SECRET
});
const app = express();


// ================= IMAGE UPLOAD =================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, "public/uploads/");
    },

    filename: (req, file, cb) => {

        cb(

            null,

            Date.now() + "-" + file.originalname
        );
    }

});

const upload = multer({

    storage

});
// ================= EMAIL =================

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {

        user: process.env.EMAIL_USER,

        pass: process.env.EMAIL_PASS

    }

});


// ================= MIDDLEWARE =================

app.use(cors());

app.use(express.json());

app.use(express.static(
    path.join(__dirname,"public")
));

app.use("/uploads", express.static("public/uploads"));


// ================= MYSQL CONNECTION =================

const db = mysql.createConnection({

    host:"localhost",

    user:"root",

    password:"Behera@123",

    database:"sttytt"
});


db.connect((err)=>{

    if(err){

        console.log(err);

    }else{

        console.log("MySQL Connected");
    }
});


// ================= JWT SECRET =================

const JWT_SECRET =
"sttytt_secret_key";



// ================= OTP STORE =================

const registerOTPStore = {};
const registerUserStore = {};
const forgotOTPStore = {};


// ================= GOOGLE CLIENT =================

const client = new OAuth2Client(
"105680066027-s82q70vlgngvrnqqivfcmkgpd80oeh08.apps.googleusercontent.com"
);


// ================= VERIFY TOKEN =================

function verifyToken(req,res,next){

    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).json({
            success:false,
            message:"Access Denied"
        });
    }

    const token = authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;

    try{

        const verified =
        jwt.verify(token, JWT_SECRET);

        req.user = verified;

        next();

    }catch(error){

        res.status(400).json({
            success:false,
            message:error.message
        });
    }
}



app.post("/api/logout", verifyToken, (req,res)=>{

    res.json({
        success:true,
        message:"Logout Successful"
    });

});


function verifyAdmin(req,res,next){

    if(req.user.role !== "admin"){

        return res.status(403).json({
            success:false,
            message:"Admin Access Only"
        });

    }

    next();
}



// ================= SEND REGISTER OTP =================

app.post("/api/send-register-otp", async (req, res) => {

    const {name,email,password} = req.body;


    console.log("Request Body:", req.body);
    console.log("Sending OTP to:", email);

    if (!email) {

        return res.json({

            success: false,

            message: "Email Required"

        });

    }

    db.query(

        "SELECT * FROM users WHERE email=?",

        [email],

        async (err, result) => {

            if (err) {

                return res.json({

                    success: false,

                    message: "Database Error"

                });

            }

            if (result.length > 0) {

                return res.json({

                    success: false,

                    message: "Email Already Registered"

                });

            }

            const otp = Math.floor(

                100000 + Math.random() * 900000

            ).toString();

            console.log("Generated OTP:", otp);


            registerOTPStore[email] = {

                         otp,

                        expires: Date.now() + 5 * 60 * 1000

                            };

                 registerUserStore[email] = {

                  name: req.body.name,

                    email,

                     password: req.body.password

                           };




            try {

                await transporter.sendMail({

    from: process.env.EMAIL_USER,

    to: email,

    subject: "Verify Your Email - STTYTT Technologies Pvt. Ltd.",

    html: `
    <div style="max-width:600px;margin:auto;font-family:Arial,sans-serif;background:#f4f4f4;padding:30px;">
        
        <div style="background:#ffffff;border-radius:10px;padding:40px;border:1px solid #e5e5e5;">
            
            <h2 style="margin:0;color:#0f172a;">
                STTYTT Technologies Pvt. Ltd.
            </h2>

            <p style="color:#555;margin-top:5px;">
                Electric Mobility E-Commerce Platform
            </p>

            <hr style="border:none;border-top:1px solid #eee;margin:25px 0;">

            <h3 style="color:#111;">
                Verify Your Email Address
            </h3>

            <p style="font-size:15px;color:#555;line-height:1.7;">
                Thank you for choosing <b>STTYTT Technologies Pvt. Ltd.</b>.
                To complete your registration and secure your account,
                please use the One-Time Password (OTP) below.
            </p>

            <div style="
                background:#f8fafc;
                border:2px dashed #2563eb;
                padding:20px;
                text-align:center;
                border-radius:8px;
                margin:30px 0;
            ">
                <p style="margin:0;font-size:14px;color:#666;">
                    Your Verification Code
                </p>

                <h1 style="
                    letter-spacing:8px;
                    color:#2563eb;
                    margin:10px 0;
                    font-size:40px;
                ">
                    ${otp}
                </h1>

                <p style="margin:0;color:#666;">
                    Valid for <b>5 Minutes</b>
                </p>
            </div>

            <p style="color:#555;font-size:15px;line-height:1.7;">
                Please enter this OTP on the verification page to activate
                your account. This code can only be used once.
            </p>

            <div style="
                background:#fff8e1;
                border-left:4px solid #f59e0b;
                padding:15px;
                margin:25px 0;
            ">
                <strong>Security Notice</strong>
                <ul style="margin-top:10px;color:#555;">
                    <li>Never share this OTP with anyone.</li>
                    <li>STTYTT will never ask for your OTP by phone, email, or chat.</li>
                    <li>If you did not request this verification, you can safely ignore this email.</li>
                </ul>
            </div>

            <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">

            <p style="font-size:14px;color:#666;line-height:1.6;">
                This is an automated email. Please do not reply to this message.
            </p>

            <p style="font-size:14px;color:#666;">
                Regards,<br>
                <strong>STTYTT Technologies Pvt. Ltd.</strong><br>
                Electric Mobility E-Commerce Platform
            </p>

        </div>

    </div>
    `
});



                console.log("Email Sent Successfully");

                res.json({

                    success: true,

                    message: "OTP Sent Successfully"

                });

            } catch (error) {


                console.log("===== EMAIL ERROR =====");

                console.log(error);

                res.json({

                    success: false,

                    message: "Email Send Failed"

                });

            }

        }

    );

});



// ================= VERIFY REGISTER OTP =================

app.post("/api/verify-register-otp", async (req, res) => {

    const {

        email,

        otp

    } = req.body;

    const savedOTP = registerOTPStore[email];

    if (!savedOTP) {

        return res.json({

            success: false,

            message: "OTP Not Found"

        });

    }

    if (Date.now() > savedOTP.expires) {

        delete registerOTPStore[email];

        delete registerUserStore[email];

        return res.json({

            success: false,

            message: "OTP Expired"

        });

    }

    if (savedOTP.otp !== otp) {

        return res.json({

            success: false,

            message: "Invalid OTP"

        });

    }

    const user = registerUserStore[email];

    const hashedPassword =

        await bcrypt.hash(user.password,10);

    db.query(

        `INSERT INTO users
        (name,email,password)
        VALUES (?,?,?)`,

        [

            user.name,

            user.email,

            hashedPassword

        ],

        (err,result)=>{

            if(err){

                return res.json({

                    success:false,

                    message:"Registration Failed"

                });

            }

            delete registerOTPStore[email];

            delete registerUserStore[email];

            const token = jwt.sign(

                {

                    id:result.insertId,

                    email:user.email

                },

                JWT_SECRET,

                {

                    expiresIn:"7d"

                }

            );

            res.json({

                success:true,

                message:"Registration Successful",

                token

            });

        }

    );

});





// ================= SEND FORGOT OTP =================

app.post("/api/send-forgot-otp",(req,res)=>{

    const { email } = req.body;

    if(!email){

        return res.json({

            success:false,

            message:"Email Required"

        });

    }

    db.query(

        "SELECT * FROM users WHERE email=?",

        [email],

        async(err,result)=>{

            if(err){

                return res.json({

                    success:false,

                    message:"Database Error"

                });

            }

            if(result.length===0){

                return res.json({

                    success:false,

                    message:"Email Not Registered"

                });

            }

            const otp=Math.floor(

                100000+Math.random()*900000

            ).toString();

            forgotOTPStore[email]={

                otp,

                expires:Date.now()+5*60*1000

            };

            try{

                await transporter.sendMail({

                    from:process.env.EMAIL_USER,

                    to:email,

                    subject:"Reset Password OTP",

                    html:`

                    <h2>STTYTT</h2>

                    <h1>${otp}</h1>

                    <p>Valid for 5 minutes</p>

                    `

                });

                res.json({

                    success:true,

                    message:"OTP Sent Successfully"

                });

            }catch(error){

                console.log(error);

                res.json({

                    success:false,

                    message:"Email Send Failed"

                });

            }

        }

    );

});






// FORGOT OTP
app.post("/api/verify-forgot-otp",(req,res)=>{

    const { email, otp } = req.body;

    const savedOTP = forgotOTPStore[email];

    if(!savedOTP){

        return res.json({

            success:false,

            message:"OTP Not Found"

        });

    }

    if(Date.now() > savedOTP.expires){

        delete forgotOTPStore[email];

        return res.json({

            success:false,

            message:"OTP Expired"

        });

    }

    if(savedOTP.otp !== otp){

        return res.json({

            success:false,

            message:"Invalid OTP"

        });

    }

    res.json({

        success:true,

        message:"OTP Verified"

    });

});



// ================= RESET PASSWORD =================

app.post("/api/reset-password", async(req,res)=>{

    const {

        email,
        password

    } = req.body;

    if(!email || !password){

        return res.json({

            success:false,

            message:"All Fields Required"

        });

    }

   if(password.length < 8){

    return res.json({

        success:false,

        message:"Password must be at least 8 characters"

    });

}


    const hashedPassword =

    await bcrypt.hash(password,10);

    db.query(

        "UPDATE users SET password=? WHERE email=?",

        [

            hashedPassword,

            email

        ],

        (err,result)=>{

            if(err){

                console.log(err);

                return res.json({

                    success:false,

                    message:"Database Error"

                });

            }

            delete forgotOTPStore[email];

            res.json({

                success:true,

                message:"Password Reset Successful"

            });

        }

    );

});












// ================= REGISTER =================

app.post("/register", async (req, res) => {

    try {

        const {
            name,
            email,
            password
        } = req.body;

        if (!name || !email || !password) {

            return res.json({
                success: false,
                message: "All fields are required"
            });
        }

        const checkSql =
            "SELECT * FROM users WHERE email=?";

        db.query(checkSql, [email],

            async (err, result) => {

                if (err) {

                    console.log("CHECK EMAIL ERROR");
                    console.log(err);

                    return res.json({
                        success: false,
                        message: "Database Error"
                    });
                }

                if (result.length > 0) {

                    return res.json({
                        success: false,
                        message: "Email already exists"
                    });
                }

                const hashedPassword =
                    await bcrypt.hash(password, 10);

                const sql = `
                INSERT INTO users
                (
                    name,
                    email,
                    password
                )
                VALUES (?,?,?)
                `;

                db.query(
                    sql,
                    [
                        name,
                        email,
                        hashedPassword
                    ],
                    (err, result) => {

                        if (err) {

                            console.log("REGISTER INSERT ERROR");
                            console.log(err);

                            return res.json({
                                success: false,
                                message: "Registration Failed"
                            });
                        }

                        const token = jwt.sign(
                            { email },
                            JWT_SECRET,
                            { expiresIn: "7d" }
                        );

                        res.json({
                            success: true,
                            message: "Registration Successful",
                            token
                        });
                    }
                );
            }
        );

    } catch (error) {

        console.log(error);

        res.json({
            success: false,
            message: "Server Error"
        });
    }
});


// ================= LOGIN =================

app.post("/login", (req, res) => {

    const {
        email,
        password
    } = req.body;

    const sql =
        "SELECT * FROM users WHERE email=?";

    db.query(
        sql,
        [email],

        async (err, result) => {

            if (err) {

                console.log("LOGIN ERROR");
                console.log(err);

                return res.json({
                    success: false,
                    message: "Database Error"
                });
            }

            if (result.length === 0) {

                return res.json({
                    success: false,
                    message: "User Not Found"
                });
            }

            const user = result[0];

            console.log("Entered Password:", password);
            console.log("DB Password:", user.password);

            const isMatch =
                await bcrypt.compare(
                    password,
                    user.password
                );

            console.log("Match:", isMatch);

            if (!isMatch) {

                return res.json({
                    success: false,
                    message: "Invalid Password"
                });
            }

            const token = jwt.sign(

                {
                    id: user.id,
                    email: user.email,
                    role: user.role
                },

                JWT_SECRET,

                {
                    expiresIn: "7d"
                }
            );

            res.json({

                success: true,

                message: "Login Successful",

                token,

                user
            });
        }
    );
});





// Google Login
app.post("/google-login", async (req, res) => {

    try {

        const { token } = req.body;

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: "105680066027-s82q70vlgngvrnqqivfcmkgpd80oeh08.apps.googleusercontent.com"
        });

        const payload = ticket.getPayload();

        const name = payload.name;
        const email = payload.email;

        db.query(
            "SELECT * FROM users WHERE email=?",
            [email],
            (err, result) => {

                if (err) {
                    return res.json({
                        success:false,
                        message:"Database Error"
                    });
                }

                // User exists
                if(result.length > 0){

                    const jwtToken = jwt.sign(
                        {
                            id: result[0].id,
                            email
                        },
                        JWT_SECRET,
                        { expiresIn:"7d" }
                    );

                    return res.json({
                        success:true,
                        token:jwtToken
                    });
                }

                // New User
                db.query(
                    "INSERT INTO users(name,email,password) VALUES(?,?,?)",
                    [name,email,"GOOGLE_AUTH"],
                    (err, insertResult) => {

                        if(err){
                            console.log(err);

                            return res.json({
                                success:false
                            });
                        }

                        const jwtToken = jwt.sign(
                            {
                                id: insertResult.insertId,
                                email
                            },
                            JWT_SECRET,
                            { expiresIn:"7d" }
                        );

                        res.json({
                            success:true,
                            token:jwtToken
                        });
                    }
                );
            }
        );

    } catch(error){

        console.log(error);

        res.json({
            success:false,
            message:"Google Auth Failed"
        });
    }
});

// ================= PROFILE =================

app.get(

"/profile",

verifyToken,

(req,res)=>{

    res.json({

        success:true,

        user:req.user
    });
});

// ================= USER DATA =================

app.get(

"/api/user-data",

verifyToken,

(req,res)=>{

    const sql =
    "SELECT * FROM users WHERE email=?";


    db.query(sql,

    [req.user.email],

    (err,result)=>{

        if(err){

            return res.json({

                success:false
            });
        }

        res.json({

            success:true,

            user:result[0]
        });
    });
});


// ================= UPDATE PROFILE / ADDRESS =================

app.post(

"/api/update-profile",

verifyToken,

(req,res)=>{

    console.log(req.body);
    console.log(req.user);

    const {

        name,
        phone,
        address,
        city,
        state,
        pincode

    } = req.body;


    const sql = `

    UPDATE users

    SET

    name=?,
    phone=?,
    address=?,
    city=?,
    state=?,
    pincode=?

    WHERE email=?

    `;


    db.query(

    sql,

    [

        name,
        phone,
        address,
        city,
        state,
        pincode,
        req.user.email

    ],

    (err,result)=>{

        if(err){

            console.log("MYSQL ERROR:");
            console.log(err);

            return res.json({

                success:false,

                message:"Update Failed"
            });
        }

        console.log(result);

        res.json({

            success:true,

            message:"Profile Updated"
        });
    });
});

// ================= GET PRODUCTS =================

app.get("/api/products",(req,res)=>{

    db.query(

        "SELECT * FROM products",

        (err,result)=>{

            if(err){

                console.log(err);

                return res.json([]);
            }

            res.json(result);
        }
    );
});


// ================= ADD PRODUCT =================



app.post(
"/api/products",verifyToken,verifyAdmin,

upload.fields([
    { name: "image", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 }
]),

(req, res) => {

    console.log(req.body);
console.log(req.files);

    console.log("POST PRODUCT API HIT");
console.log(req.body);

    const {

        name,
        category,
        description,
        price,
        speed,
        range_km,
        battery,
        warranty,
        fast_charging_hours,
        brake_type
    

    } = req.body;

const image =
req.files?.image
? "/uploads/" + req.files.image[0].filename
: "";

const image2 =
req.files?.image2
? "/uploads/" + req.files.image2[0].filename
: "";

const image3 =
req.files?.image3
? "/uploads/" + req.files.image3[0].filename
: "";

const image4 =
req.files?.image4
? "/uploads/" + req.files.image4[0].filename
: "";

    const sql = `

    INSERT INTO products

    (
        name,
        category,
        description,
        price,
        speed,
        range_km,
        battery,
        warranty,
        fast_charging_hours,
        brake_type,
        image,
        image2,
        image3,
        image4
    )

    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)

    `;

    db.query(

        sql,

        [
            name,
            category,
            description,
            price,
            speed,
            range_km,
            battery,
            warranty,
            fast_charging_hours,
            brake_type,
            image,
            image2,
             image3,
             image4
        ],

        (err,result)=>{

            if(err){

                console.log("ADD PRODUCT ERROR");
                console.log(err);

                return res.json({

                    success:false,
                    message:"Product Add Failed"
                });
            }
console.log("INSERT RESULT => ");
console.log(result);


db.query(

    "SELECT email FROM users",

    (err,users)=>{

        if(!err){

            users.forEach(user=>{

                createNotification(

                    user.email,

                    "New Product Added",

                    `${name} is now available.`

                );

            });
        }
    }
);
            

            res.json({

                success:true,
                message:"Product Added Successfully"
            });
        }
    );
});


// ================= DELETE PRODUCT =================

app.delete("/api/products/:id",verifyToken,verifyAdmin,(req,res)=>{

    console.log("DELETE HIT");
    console.log(req.params.id);

    db.query(

        "DELETE FROM products WHERE id=?",

        [req.params.id],

        (err,result)=>{

            if(err){

                console.log(err);

                return res.json({

                    success:false
                });
            }

            res.json({

                success:true,
                message:"Product Deleted"
            });
        }
    );
});


// ================= ADD TO CART =================

app.post("/api/cart", verifyToken, (req,res)=>{

    const {
        product_id,
        product_name,
        product_price,
        product_image,
        quantity
    } = req.body;

    const sql = `
    INSERT INTO cart
    (
        user_email,
        product_id,
        product_name,
        product_price,
        product_image,
        quantity
    )
    VALUES (?,?,?,?,?,?)
    `;

    db.query(
        sql,
        [
            req.user.email,
            product_id,
            product_name,
            product_price,
            product_image,
            quantity
        ],
        (err,result)=>{

            if(err){
                console.log(err);

                return res.json({
                    success:false,
                    message:"Cart Insert Failed"
                });
            }

            res.json({
                success:true,
                message:"Added To Cart"
            });
        }
    );
});
// ================= GET CART =================

app.get(

"/api/cart",

verifyToken,

(req,res)=>{

    db.query(

        `SELECT *
        FROM cart
        WHERE user_email=?
        ORDER BY id DESC`,

        [req.user.email],

        (err,result)=>{

            res.json(result);
        }
    );
});


// ================= UPDATE CART =================

app.put("/api/cart/:id", verifyToken, (req,res)=>{

    const { quantity } = req.body;


    const sql = `

    UPDATE cart
    SET quantity=?
    WHERE id=?

    `;


    db.query(sql,

    [quantity, req.params.id],

    ()=>{

        res.json({

            success:true
        });
    });
});


// ================= DELETE CART =================

app.delete("/api/cart/:id", verifyToken,(req,res)=>{

    db.query(

    "DELETE FROM cart WHERE id=?",

    [req.params.id],

    ()=>{

        res.json({

            success:true
        });
    });
});

// ROZORPAY
app.post(
    "/api/create-razorpay-order",
    verifyToken,
    async (req,res)=>{

        try{

            const { amount } = req.body;

            const order =
            await razorpay.orders.create({

                amount: amount * 100,

                currency: "INR",

                receipt:
                "receipt_" + Date.now()
            });

            res.json({

                success:true,

                order
            });

        }catch(error){

            console.log(error);

            res.json({

                success:false,

                message:"Razorpay Order Failed"
            });
        }
    }
);













// ================= PLACE ORDER =================

app.post(

"/api/place-order",

verifyToken,

(req,res)=>{

    const {

        payment_method,
        payment_id

    } = req.body;


    const cartSql =

`SELECT *
FROM cart
WHERE user_email=?`;


    db.query(

cartSql,

[req.user.email],

(err,cartItems)=>{

        if(err){

            return res.json({

                success:false,

                message:"Cart Error"
            });
        }


        let total = 0;

        cartItems.forEach(item=>{

            total +=

            item.product_price *
            item.quantity;
        });


        total += 0;


        const userSql =
        "SELECT * FROM users WHERE email=?";


        db.query(userSql,

        [req.user.email],

        (err,userResult)=>{

            const user =
            userResult[0];

           const trackingId =
"EB" + Date.now();

const orderSql = `

INSERT INTO orders
(
    user_email,
    products,
    total_price,
    payment_method,
    payment_id,
    tracking_id,
    order_status,
    customer_name,
    phone,
    address,
    city,
    state,
    pincode
)

VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)

`;

            db.query(orderSql,[

                req.user.email,

                JSON.stringify(cartItems),

                total,

                payment_method,
                payment_id,
                trackingId,

                "Processing",

                user.name,

                user.phone,

                user.address,

                user.city,

                user.state,

                user.pincode

            ],

            (err,result)=>{

                if(err){

                    console.log("ORDER SQL ERROR");
                    console.log(err);

                    return res.json({

                        success:false,

                        message:err.sqlMessage
                    });
                }


                // NOTIFICATION

    createNotification(

        req.user.email,

        "Order Placed",

        `Your order ${trackingId} has been placed successfully.`
    );


                // CLEAR CART

                db.query(

                "DELETE FROM cart WHERE user_email=?",
                [req.user.email]
                );


                res.json({

                    success:true,

                    message:"Order Placed"
                });
            });
        });
    });
});


// ================= GET ORDERS =================

app.get(

"/api/orders",

verifyToken,

(req,res)=>{

    const sql =
    "SELECT * FROM orders WHERE user_email=? ORDER BY id DESC";


    db.query(sql,

    [req.user.email],

    (err,result)=>{

        res.json(result);
    });
});

// cancel Get

app.put("/api/orders/:id/cancel", verifyToken, (req,res)=>{

    const orderId = req.params.id;

    db.query(

        "SELECT * FROM orders WHERE id=? AND user_email=?",

        [orderId, req.user.email],

        (err,result)=>{

            if(err || result.length===0){
                return res.json({
                    success:false,
                    message:"Order not found"
                });
            }

            const order = result[0];

            if(
                order.order_status==="Out For Delivery" ||
                order.order_status==="Delivered" ||
                order.order_status==="Cancelled"
            ){
                return res.json({
                    success:false,
                    message:"Order cannot be cancelled."
                });
            }

            db.query(

                "UPDATE orders SET order_status='Cancelled', cancelled_by='User' WHERE id=?",

                [orderId],

                ()=>{

                    createNotification(

                        order.user_email,

                        "Order Cancelled",

                        `Your order ${order.tracking_id} has been cancelled.`

                    );

                    res.json({
                        success:true,
                        message:"Order cancelled successfully."
                    });

                }

            );

        }

    );

});








// INVOICE

// ======================
// PROFESSIONAL INVOICE
// ======================

app.get("/api/invoice/:id", verifyToken, async (req, res) => {

    const orderId = req.params.id;

    db.query(
        "SELECT * FROM orders WHERE id=? AND user_email=?",
        [orderId, req.user.email],
        async (err, result) => {

            if (err || result.length === 0) {
                return res.status(404).send("Order Not Found");
            }

            const order = result[0];
            const products = JSON.parse(order.products);

            const doc = new PDFDocument({
                size: "A4",
                margin: 40
            });

            res.setHeader("Content-Type", "application/pdf");

            res.setHeader(
                "Content-Disposition",
                `attachment; filename=Invoice-${order.id}.pdf`
            );

            doc.pipe(res);

            // ======================
            // LOGO
            // ======================

            try {

                doc.image(
                    path.join(__dirname, "public/images/logo.png"),
                    40,
                    35,
                    {
                        width: 55
                    }
                );

            } catch (e) {

                console.log("Logo Missing");

            }

            // ======================
            // COMPANY
            // ======================

            doc
                .fontSize(22)
                .fillColor("#ff6600")
                .text("STTYTT TECHNOLOGIES", 110, 40);

            doc
                .fontSize(11)
                .fillColor("#444")
                .text("Sustainable Electric Mobility", 110, 68);

            doc.text("Bhubaneswar, Odisha", 110, 84);

            doc.text("support@sttytt.com", 110, 100);

            doc.text("+91 8480114554", 110, 116);

            // ======================
            // INVOICE TITLE
            // ======================

            doc
                .fontSize(28)
                .fillColor("#111")
                .text("INVOICE", 420, 45);

            doc.moveTo(40, 150)
                .lineTo(555, 150)
                .stroke("#dddddd");

            // ======================
            // INVOICE DETAILS
            // ======================

            doc
                .fontSize(11)
                .fillColor("black");

            doc.text(
                `Invoice No : INV-${1000 + order.id}`,
                40,
                170
            );

            doc.text(
                `Order ID : ${order.id}`,
                40,
                190
            );

            doc.text(
                `Tracking ID : ${order.tracking_id}`,
                40,
                210
            );

            doc.text(
                `Invoice Date : ${new Date(order.created_at).toLocaleDateString()}`,
                40,
                230
            );

            doc.text(
                `Payment : ${order.payment_method}`,
                330,
                170
            );

            const paymentStatus =
                order.payment_method === "COD"
                    ? (order.order_status === "Delivered"
                        ? "Paid"
                        : "Pending")
                    : "Paid";

            doc.text(
                `Payment Status : ${paymentStatus}`,
                330,
                190
            );

            doc.text(
                `Order Status : ${order.order_status}`,
                330,
                210
            );

            doc.moveTo(40, 255)
                .lineTo(555, 255)
                .stroke("#dddddd");

            // ======================
            // CUSTOMER DETAILS
            // ======================

            doc
                .fontSize(15)
                .fillColor("#ff6600")
                .text("Bill To", 40, 275);

            doc
                .fontSize(11)
                .fillColor("black");

            doc.text(order.customer_name, 40, 300);

            doc.text(order.phone, 40, 318);

            doc.text(order.address, 40, 336);

            doc.text(
                `${order.city}, ${order.state} - ${order.pincode}`,
                40,
                354
            );

            // ======================
            // PRODUCT TABLE
            // (Continue in Part 2)
            // ======================
            // ======================
// PRODUCT TABLE HEADER
// ======================

let y = 390;

doc
    .rect(40, y, 515, 28)
    .fill("#ff6600");

doc
    .fillColor("white")
    .fontSize(11);

doc.text("Product", 50, y + 8);

doc.text("Qty", 300, y + 8, {
    width: 40,
    align: "center"
});

doc.text("Price", 365, y + 8, {
    width: 70,
    align: "right"
});

doc.text("Total", 470, y + 8, {
    width: 70,
    align: "right"
});

doc.fillColor("black");

y += 28;

let subtotal = 0;

// ======================
// PRODUCTS
// ======================

products.forEach((item, index) => {

    // Automatic new page
    if (y > 700) {

        doc.addPage();

        y = 50;

        doc
            .rect(40, y, 515, 28)
            .fill("#ff6600");

        doc.fillColor("white");

        doc.text("Product", 50, y + 8);

        doc.text("Qty", 300, y + 8, {
            width: 40,
            align: "center"
        });

        doc.text("Price", 365, y + 8, {
            width: 70,
            align: "right"
        });

        doc.text("Total", 470, y + 8, {
            width: 70,
            align: "right"
        });

        doc.fillColor("black");

        y += 28;
    }

    const total =
        Number(item.product_price) *
        Number(item.quantity);

    subtotal += total;

    // Row Border
    doc
        .rect(40, y, 515, 30)
        .stroke("#dddddd");

    // Product Name
    doc
        .fontSize(10)
        .text(
            item.product_name,
            50,
            y + 9,
            {
                width: 220
            }
        );

    // Qty
    doc.text(
        item.quantity.toString(),
        305,
        y + 9,
        {
            width: 30,
            align: "center"
        }
    );

    // Price
    doc.text(
        `₹${item.product_price}`,
        360,
        y + 9,
        {
            width: 70,
            align: "right"
        }
    );

    // Total
    doc.text(
        `₹${total}`,
        465,
        y + 9,
        {
            width: 70,
            align: "right"
        }
    );

    y += 30;

});

// ======================
// SPACE AFTER TABLE
// ======================

y += 25;

// Continue in Part 3...
// ======================
// TOTAL SECTION
// ======================

const shipping = 0;
const discount = 0;
const gst = 0;
const grandTotal = Number(order.total_price);

// Agar page me space kam ho to new page
if (y > 620) {
    doc.addPage();
    y = 60;
}

// Line
doc
    .moveTo(300, y)
    .lineTo(555, y)
    .stroke("#cccccc");

y += 20;

// Subtotal
doc
    .fontSize(11)
    .fillColor("black")
    .text("Subtotal", 320, y);

doc.text(
    `₹${subtotal.toFixed(2)}`,
    470,
    y,
    {
        width: 70,
        align: "right"
    }
);

y += 22;

// Shipping
doc.text("Shipping", 320, y);

doc.text(
    shipping === 0 ? "FREE" : `₹${shipping}`,
    470,
    y,
    {
        width: 70,
        align: "right"
    }
);

y += 22;

// Discount
doc.text("Discount", 320, y);

doc.text(
    `₹${discount}`,
    470,
    y,
    {
        width: 70,
        align: "right"
    }
);

y += 22;

// GST
doc.text("GST", 320, y);

doc.text(
    gst === 0 ? "Included" : `₹${gst}`,
    470,
    y,
    {
        width: 70,
        align: "right"
    }
);

y += 30;

// ======================
// GRAND TOTAL BOX
// ======================

doc
    .roundedRect(300, y - 10, 255, 40, 5)
    .fill("#fff4e8");

doc
    .fillColor("#ff6600")
    .fontSize(16)
    .text("Grand Total", 315, y + 2);

doc.text(
    `₹${grandTotal.toFixed(2)}`,
    445,
    y + 2,
    {
        width: 90,
        align: "right"
    }
);

doc.fillColor("black");

y += 70;

// ======================
// PAYMENT DETAILS
// ======================

if (y > 650) {
    doc.addPage();
    y = 60;
}

doc
    .fontSize(15)
    .fillColor("#ff6600")
    .text("Payment Details", 40, y);

y += 28;

doc
    .fontSize(11)
    .fillColor("black");

doc.text(
    `Payment Method : ${order.payment_method}`,
    40,
    y
);

y += 20;

doc.text(
    `Payment Status : ${paymentStatus}`,
    40,
    y
);

y += 20;

doc.text(
    `Order Status : ${order.order_status}`,
    40,
    y
);

y += 20;

doc.text(
    `Tracking ID : ${order.tracking_id}`,
    40,
    y
);

y += 40;

// ======================
// Continue in Part 4
// ======================
// ======================
// THANK YOU
// ======================

doc
    .moveTo(40, y)
    .lineTo(555, y)
    .stroke("#dddddd");

y += 20;

doc
    .fontSize(20)
    .fillColor("#ff6600")
    .text(
        "Thank You For Shopping!",
        40,
        y,
        {
            width: 515,
            align: "center"
        }
    );

y += 35;

doc
    .fontSize(11)
    .fillColor("#444444")
    .text(
        "We appreciate your purchase from STTYTT Technologies.",
        40,
        y,
        {
            width: 515,
            align: "center"
        }
    );

y += 35;

// ======================
// TERMS
// ======================

doc
    .fontSize(13)
    .fillColor("#ff6600")
    .text("Terms & Conditions", 40, y);

y += 20;

doc
    .fontSize(10)
    .fillColor("black");

doc.text("• Goods once sold will not be taken back except manufacturing defects.");

doc.text("• Warranty is applicable as per company policy.");

doc.text("• This is a computer-generated invoice and does not require a physical signature.");

y += 40;

// ======================
// FOOTER
// ======================

doc.moveTo(40, y)
    .lineTo(555, y)
    .stroke("#dddddd");

y += 15;

doc
    .fontSize(14)
    .fillColor("#ff6600")
    .text(
        "STTYTT TECHNOLOGIES PVT. LTD.",
        40,
        y,
        {
            width: 515,
            align: "center"
        }
    );

y += 22;

doc
    .fontSize(10)
    .fillColor("#555555")
    .text(
        "Sustainable Electric Mobility Store",
        40,
        y,
        {
            width: 515,
            align: "center"
        }
    );

y += 18;

doc.text(
    "Email : sttytt.com@gmail.com",
    40,
    y,
    {
        width: 515,
        align: "center"
    }
);

y += 16;

doc.text(
    "Website : www.sttytt.com",
    40,
    y,
    {
        width: 515,
        align: "center"
    }
);

y += 16;

doc.text(
    "Customer Care : +91 8480114554",
    40,
    y,
    {
        width: 515,
        align: "center"
    }
);

y += 25;

doc
    .fontSize(9)
    .fillColor("#888888")
    .text(
        "© 2026 STTYTT Technologies Pvt. Ltd. All Rights Reserved.",
        40,
        y,
        {
            width: 515,
            align: "center"
        }
    );

// ======================
// FINISH PDF
// ======================

doc.end();

        }
    );

});














// notification
app.get(

"/api/notifications",

verifyToken,

(req,res)=>{

    db.query(

        `SELECT *
        FROM notifications
        WHERE user_email=?
        ORDER BY id DESC`,

        [req.user.email],

        (err,result)=>{

            if(err){

                return res.json([]);
            }

            res.json(result);
        }
    );
});



app.get(

"/api/notification-count",

verifyToken,

(req,res)=>{

    db.query(

        `SELECT COUNT(*) AS total
        FROM notifications
        WHERE user_email=?
        AND is_read=0`,

        [req.user.email],

        (err,result)=>{

            res.json({

                count:
                result[0].total
            });
        }
    );
});


app.post(

"/api/read-notifications",

verifyToken,

(req,res)=>{

    db.query(

        `UPDATE notifications
        SET is_read=1
        WHERE user_email=?`,

        [req.user.email],

        ()=>{

            res.json({
                success:true
            });
        }
    );
});




// Notification

function createNotification(
    userEmail,
    title,
    message
){

    db.query(

        `INSERT INTO notifications
        (user_email,title,message)
        VALUES (?,?,?)`,

        [userEmail,title,message],

        (err)=>{

            if(err){

                console.log(
                    "NOTIFICATION ERROR",
                    err
                );
            }
        }
    );

}

// ADMIN
app.get("/api/admin/orders",verifyToken,verifyAdmin,(req,res)=>{

    db.query(

        "SELECT * FROM orders ORDER BY id DESC",

        (err,result)=>{

            if(err){

                return res.json([]);
            }

            res.json(result);
        }
    );
});



// order status
app.put("/api/admin/order-status/:id",verifyToken,verifyAdmin,(req,res)=>{

    const { status } = req.body;

    const orderId = req.params.id;

    db.query(

        "SELECT * FROM orders WHERE id=?",

        [orderId],

        (err,result)=>{

            if(err || result.length===0){

                return res.json({
                    success:false
                });
            }

            const order = result[0];

            if(status === "Cancelled"){

                db.query(

                    "UPDATE orders SET order_status=?, cancelled_by='Admin' WHERE id=?",

                    [status, orderId],

                    ()=>{

                        createNotification(

                            order.user_email,

                            "Order Update",

                            `Your order ${order.tracking_id} is now ${status}`

                        );

                        res.json({
                            success:true
                        });

                    }

                );

            }else{

                db.query(

                    "UPDATE orders SET order_status=? WHERE id=?",

                    [status, orderId],

                    ()=>{

                        createNotification(

                            order.user_email,

                            "Order Update",

                            `Your order ${order.tracking_id} is now ${status}`

                        );

                        res.json({
                            success:true
                        });

                    }

                );

            }

        }

    );

});





// send notification
app.post("/api/admin/send-notification",verifyToken,
verifyAdmin,(req,res)=>{

    const {

        title,
        message

    } = req.body;

    db.query(

        "SELECT email FROM users",

        (err,users)=>{

            users.forEach(user=>{

                createNotification(

                    user.email,

                    title,

                    message
                );
            });

            res.json({

                success:true
            });
        }
    );
});


// ================= ALL CUSTOMERS =================

app.get("/api/admin/users",verifyToken,verifyAdmin, (req, res) => {

    const sql = `
    SELECT
        id,
        name,
        email,
        phone,
        address,
        city,
        state,
        pincode
    FROM users
    ORDER BY id DESC
    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.log(err);

            return res.json([]);
        }

        res.json(result);
    });
});

app.delete(

"/api/admin/users/:id",verifyToken,verifyAdmin,

(req,res)=>{

    db.query(

        "DELETE FROM users WHERE id=?",

        [req.params.id],

        (err,result)=>{

            if(err){

                return res.json({

                    success:false
                });
            }

            res.json({

                success:true,
                message:"User Deleted"
            });
        }
    );
});





// RIVIEWS
app.post("/api/reviews", verifyToken, (req,res)=>{

const {name,email,subject,message}=req.body;

const userId=req.user.id;

const sql=`
INSERT INTO reviews
(user_id,name,email,subject,message)
VALUES(?,?,?,?,?)
`;

db.query(
sql,
[userId,name,email,subject,message],
(err,result)=>{

if(err){
return res.status(500).json({
message:"Database Error"
});
}

res.json({
message:"Review Submitted Successfully"
});

});

});




// ================= REVIEWS =================

// Review List
app.get("/api/admin/reviews",verifyToken,verifyAdmin, (req, res) => {

    db.query(
        "SELECT * FROM reviews ORDER BY id DESC",
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json(result);
        }
    );

});


// Delete Review
app.delete("/api/admin/reviews/:id",verifyToken,verifyAdmin, (req, res) => {

    db.query(
        "DELETE FROM reviews WHERE id=?",
        [req.params.id],
        (err) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                message: "Review Deleted Successfully"
            });

        }
    );

});


// ================= START SERVER =================

app.listen(5000,()=>{

    console.log(
        "Server Running On Port 5000"
    );
});