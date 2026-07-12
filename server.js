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



// HERO STATES
app.get("/api/hero-stats",(req,res)=>{

const sql = `
SELECT *
FROM hero_stats
ORDER BY display_order ASC
`;

db.query(sql,(err,result)=>{

if(err) return res.status(500).json(err);

res.json(result);

});

});


// UPDATE HERO STATES
app.put("/api/hero-stats/:id",verifyToken,verifyAdmin,(req,res)=>{

const {value}=req.body;

const id=req.params.id;

db.query(

"UPDATE hero_stats SET value=? WHERE id=?",

[value,id],

(err)=>{

if(err) return res.status(500).json(err);

res.json({

message:"Updated"

});

});

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
        district,
        state,
        pincode

    } = req.body;


    const sql = `

    UPDATE users

    SET

    name=?,
    phone=?,
    address=?,
    district=?,
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
        district,
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
        brake_type,
    

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

    const { payment_method, payment_id,utr_number,cartIds } = req.body;

    if(!cartIds || cartIds.length===0){

    return res.json({

        success:false,

        message:"No Product Selected"

    });

}

 db.query(

"SELECT * FROM cart WHERE user_email=? AND id IN (?)",

[req.user.email, cartIds],

(err,cartItems)=>{

            if(err){

                return res.json({
                    success:false,
                    message:"Cart Error"
                });

            }

                if (cartItems.length === 0) {

        return res.json({
            success: false,
            message: "Selected products not found"
        });

    }

            db.query(

                "SELECT * FROM users WHERE email=?",

                [req.user.email],

                (err,userResult)=>{

                    if(err || userResult.length===0){

                        return res.json({
                            success:false,
                            message:"User Not Found"
                        });

                    }

                     
                    // ================= SUBTOTAL =================

                    let subtotal = 0;

                    cartItems.forEach(item=>{

                        subtotal +=
                        item.product_price *
                        item.quantity;

                    });

                    // ================= SHIPPING =================
                      const user = userResult[0];

                    const shippingCharge =
                    getShippingCharge(user.state);

                    // ================= TOTAL =================

                    const total =
                    subtotal + shippingCharge;

                    const trackingId =
                    "EB" + Date.now();

                    const estimatedDelivery =
                    new Date();

                    estimatedDelivery.setDate(
                        estimatedDelivery.getDate() + 7
                    );

                    const estimatedDeliveryDate =
                    estimatedDelivery
                    .toISOString()
                    .split("T")[0];

                    const orderSql = `

                    INSERT INTO orders
                    (
                        user_email,
                        products,
                        total_price,
                        shipping_charge,
                        payment_method,
                        payment_id,
                        utr_number,
                        tracking_id,
                        order_status,
                        estimated_delivery,
                        customer_name,
                        phone,
                        address,
                        district,
                        state,
                        pincode
                    )

                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)

                    `;

                    db.query(

                        orderSql,

                        [

                            req.user.email,

                            JSON.stringify(cartItems),

                            total,

                            shippingCharge,

                            payment_method,

                            payment_id,
                            
                            utr_number,

                            trackingId,

                            "Processing",

                            estimatedDeliveryDate,

                            user.name,

                            user.phone,

                            user.address,

                            user.district,

                            user.state,

                            user.pincode

                        ],

                        (err,result)=>{

                            if(err){

                                console.log(err);

                                return res.json({

                                    success:false,

                                    message:err.sqlMessage

                                });

                            }

                            createNotification(

                                req.user.email,

                                "Order Placed",

                                `Your order ${trackingId} has been placed successfully.`

                            );
                             db.query(

    "DELETE FROM cart WHERE id IN (?)",

    [cartIds],

    (err)=>{

        if(err){

            return res.json({

                success:false,

                message:"Cart Delete Failed"

            });

        }

        res.json({

            success:true,

            message:"Order Placed"

        });

    }

);

                        }

                    );

                }

            );

        }

    );

});




function getShippingCharge(state){

    const shipping = {

        "Odisha":299,
        "West Bengal":499,
        "Jharkhand":499,
        "Chhattisgarh":499,
        "Andhra Pradesh":599,
        "Telangana":699,
        "Karnataka":699,
        "Tamil Nadu":799,
        "Maharashtra":799,
        "Delhi":899,
        "Gujarat":899,
        "Rajasthan":899,
        "Punjab":999,
        "Haryana":899,
        "Kerala":999,
        "Assam":999

    };

    return shipping[state] || 999;
}

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

    "UPDATE orders SET order_status='Cancelled', cancelled_by='User', cancelled_at=NOW() WHERE id=?",

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



// ================= CHECKOUT SUMMARY =================
app.post(
"/api/checkout-summary",
verifyToken,
(req,res)=>{

const { cartIds } = req.body;
if(!cartIds || cartIds.length===0){

    return res.json({

        success:false,

        message:"No Product Selected"

    });

}

db.query(

"SELECT * FROM users WHERE email=?",

[req.user.email],

(err,userResult)=>{

if(err || userResult.length===0){

return res.json({

success:false,

message:"User Not Found"

});

}

const user=userResult[0];

db.query(

"SELECT * FROM cart WHERE user_email=? AND id IN (?)",

[req.user.email,cartIds],

(err,cart)=>{

if(err){

return res.json({

success:false,

message:"Cart Error"

});

}

let subtotal=0;

cart.forEach(item=>{

subtotal+=

Number(item.product_price)*

Number(item.quantity);

});

const shipping=

getShippingCharge(user.state);

const total=

subtotal+shipping;

res.json({

success:true,

items:cart,

subtotal,

shipping,

total

});

});

});

});



// ================= THEME COLORS =================
const COLOR = {
    maroon: "#4A0E1F",       // deep velvet maroon (headers, titles)
    maroonLight: "#6E1B33",  // secondary maroon (table header bg)
    gold: "#C9A227",         // golden accent (lines, borders, highlights)
    goldLight: "#E8D9A0",    // soft gold (highlight boxes)
    offWhite: "#FBF8F1",     // background tint
    ink: "#2B2B2B",          // main text
    subtext: "#6F6F6F",      // secondary text
    border: "#E4D9C4"        // soft border tone
};

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
            // PAGE BACKGROUND TINT
            // ======================

            doc
                .rect(0, 0, doc.page.width, doc.page.height)
                .fill(COLOR.offWhite);

            // ======================
            // HEADER BAND (Velvet Maroon)
            // ======================

            doc
                .rect(0, 0, doc.page.width, 130)
                .fill(COLOR.maroon);

            // Thin gold accent line under header
            doc
                .rect(0, 130, doc.page.width, 4)
                .fill(COLOR.gold);

            // ======================
            // LOGO
            // ======================
const headerHeight = 130;
const logoWidth = 130;
const logoHeight = 65;

const logoX = 30;
const logoY = (headerHeight - logoHeight) / 2; 


try {
doc.image(
    path.join(__dirname, "public/image/1000561758-removebg-preview.png"),
    logoX,
    logoY,
    {
        fit: [logoWidth, logoHeight]
    }
);
} catch (err) {
    console.log("Logo Missing");
}

const textX = logoX + logoWidth + 25;
            // ======================
            // COMPANY NAME + TAGLINE
            // ======================

            doc
                .fontSize(10)
                .fillColor("#EDE3C8")
                .text("Sustainable Electric Mobility", textX, 48);

            doc
                .fontSize(9)
                .fillColor("#D8C9A3")
                .text("Bhubaneswar, Odisha  |  sttytt.com@gmail.com |  +91 8480114554", textX,68);

            // ======================
            // INVOICE TITLE (right side of header)
            // ======================

            doc
                .fontSize(30)
                .fillColor(COLOR.gold)
                .text("INVOICE", 380, 40, { width: 175, align: "right" });

            doc
                .fontSize(10)
                .fillColor("#EDE3C8")
                .text(`INV-${1000 + order.id}`, 380, 78, { width: 175, align: "right" });

            // ======================
            // INVOICE DETAILS STRIP
            // ======================

            let y = 155;

            doc
                .roundedRect(40, y, 515, 80, 6)
                .fillAndStroke("#ffffff", COLOR.border);

            doc.fillColor(COLOR.subtext).fontSize(9);
            doc.text("ORDER ID", 55, y + 12);
            doc.text("TRACKING ID", 195, y + 12);
            doc.text("INVOICE DATE", 335, y + 12);

            doc.fillColor(COLOR.ink).fontSize(11);
            doc.text(order.id.toString(), 55, y + 26);
            doc.text(order.tracking_id || "N/A", 195, y + 26);
            doc.text(new Date(order.created_at).toLocaleDateString(), 335, y + 26);

            const paymentStatus =
                order.payment_method === "COD"
                    ? (order.order_status === "Delivered" ? "Paid" : "Pending")
                    : "Paid";

            doc.fillColor(COLOR.subtext).fontSize(9);
            doc.text("PAYMENT METHOD", 55, y + 48);
            doc.text("PAYMENT STATUS", 195, y + 48);
            doc.text("ORDER STATUS", 335, y + 48);

            doc.fillColor(COLOR.ink).fontSize(11);
            doc.text(order.payment_method, 55, y + 62);

            doc
                .fillColor(paymentStatus === "Paid" ? "#2E7D32" : COLOR.maroon)
                .text(paymentStatus, 195, y + 62);

            doc.fillColor(COLOR.ink).text(order.order_status, 335, y + 62);

            y += 100;

            // ======================
            // BILL TO
            // ======================

            doc
                .fontSize(13)
                .fillColor(COLOR.maroon)
                .text("BILL TO", 40, y);

            doc
                .moveTo(40, y + 16)
                .lineTo(120, y + 16)
                .lineWidth(2)
                .stroke(COLOR.gold);

            y += 26;

            doc.fillColor(COLOR.ink).fontSize(11);
            doc.text(order.customer_name, 40, y);
            doc.text(order.phone, 40, y + 16);
            doc.text(order.address, 40, y + 32, { width: 300 });
            doc.text(`${order.district}, ${order.state} - ${order.pincode}`, 40, y + 48);

            y += 80;

            // ======================
            // PRODUCT TABLE HEADER
            // ======================

            const drawTableHeader = (yPos) => {
                doc
                    .roundedRect(40, yPos, 515, 30, 4)
                    .fill(COLOR.maroonLight);

                doc.fillColor(COLOR.goldLight).fontSize(10);
                doc.text("PRODUCT", 55, yPos + 10);
                doc.text("QTY", 300, yPos + 10, { width: 40, align: "center" });
                doc.text("PRICE", 365, yPos + 10, { width: 70, align: "right" });
                doc.text("TOTAL", 470, yPos + 10, { width: 70, align: "right" });

                doc.fillColor(COLOR.ink);
                return yPos + 30;
            };

            y = drawTableHeader(y);

            let subtotal = 0;

            // ======================
            // PRODUCT ROWS
            // ======================

            products.forEach((item, index) => {

                if (y > 700) {
                    doc.addPage();
                    doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLOR.offWhite);
                    y = 50;
                    y = drawTableHeader(y);
                }

                const total = Number(item.product_price) * Number(item.quantity);
                subtotal += total;

                // Zebra striping for readability
                if (index % 2 === 0) {
                    doc.rect(40, y, 515, 30).fill("#FFFFFF");
                } else {
                    doc.rect(40, y, 515, 30).fill("#F3ECD9");
                }

                doc
                    .rect(40, y, 515, 30)
                    .stroke(COLOR.border);

                doc
                    .fillColor(COLOR.ink)
                    .fontSize(10)
                    .text(item.product_name, 50, y + 9, { width: 220 });

                doc.text(item.quantity.toString(), 305, y + 9, { width: 30, align: "center" });
                doc.text(`Rs. ${item.product_price}`, 360, y + 9, { width: 70, align: "right" });
                doc.text(`Rs. ${total}`, 465, y + 9, { width: 70, align: "right" });

                y += 30;
            });

            y += 25;

            // ======================
            // TOTALS
            // ======================

            const shipping =
            Number(order.shipping_charge || 0);
            const discount = 0;
            const gst = 0;
            const grandTotal = Number(order.total_price);

            if (y > 600) {
                doc.addPage();
                doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLOR.offWhite);
                y = 60;
            }

            doc.moveTo(300, y).lineTo(555, y).stroke(COLOR.gold);
            y += 18;

            const totalRow = (label, value, bold = false) => {
                doc
                    .fontSize(bold ? 12 : 10)
                    .fillColor(bold ? COLOR.maroon : COLOR.subtext)
                    .text(label, 320, y);

                doc
                    .fillColor(bold ? COLOR.maroon : COLOR.ink)
                    .text(value, 465, y, { width: 75, align: "right" });

                y += bold ? 24 : 20;
            };

            totalRow("Subtotal", `Rs. ${subtotal.toFixed(2)}`);
            totalRow("Shipping", shipping === 0 ? "FREE" : `Rs. ${shipping}`);
            totalRow("Discount", `Rs. ${discount}`);
            totalRow("GST", gst === 0 ? "Included" : `Rs. ${gst}`);

            y += 8;

            // ======================
            // GRAND TOTAL — GOLD BOX
            // ======================

            doc
                .roundedRect(300, y - 10, 255, 42, 6)
                .fillAndStroke(COLOR.goldLight, COLOR.gold);

            doc
                .fillColor(COLOR.maroon)
                .fontSize(15)
                .text("GRAND TOTAL", 315, y + 3);

            doc
                .fontSize(16)
                .text(`Rs. ${grandTotal.toFixed(2)}`, 440, y + 2, { width: 95, align: "right" });

            y += 75;

            // ======================
            // QR CODE — TRACKING / PAYMENT VERIFICATION
            // ======================

            try {
                const qrData = `https://sttytt.com/track/${order.tracking_id || order.id}`;
                const qrBuffer = await QRCode.toBuffer(qrData, {
                    margin: 1,
                    color: {
                        dark: COLOR.maroon,
                        light: "#FFFFFF"
                    }
                });

                if (y > 640) {
                    doc.addPage();
                    doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLOR.offWhite);
                    y = 60;
                }

                doc
                    .fontSize(13)
                    .fillColor(COLOR.maroon)
                    .text("Scan to Track Your Order", 40, y);

                doc.image(qrBuffer, 40, y + 18, { width: 80 });

                doc
                    .fontSize(9)
                    .fillColor(COLOR.subtext)
                    .text(qrData, 130, y + 45, { width: 200 });

                // Payment details beside QR
                doc
                    .fontSize(13)
                    .fillColor(COLOR.maroon)
                    .text("Payment Details", 340, y);

                doc.fontSize(10).fillColor(COLOR.ink);
                doc.text(`Method: ${order.payment_method}`, 340, y + 20);
                doc.text(`Status: ${paymentStatus}`, 340, y + 36);
                doc.text(`Order Status: ${order.order_status}`, 340, y + 52);

                y += 115;

            } catch (e) {
                console.log("QR generation failed:", e.message);
                y += 20;
            }

            // ======================
            // THANK YOU BAND
            // ======================

            if (y > 650) {
                doc.addPage();
                doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLOR.offWhite);
                y = 60;
            }

            doc.moveTo(40, y).lineTo(555, y).stroke(COLOR.border);
            y += 22;

            doc
                .fontSize(18)
                .fillColor(COLOR.maroon)
                .text("Thank You For Shopping With Us!", 40, y, { width: 515, align: "center" });

            y += 28;

            doc
                .fontSize(10)
                .fillColor(COLOR.subtext)
                .text(
                    "We appreciate your trust in sustainable electric mobility from STTYTT Technologies.",
                    40, y, { width: 515, align: "center" }
                );

            y += 35;

            // ======================
            // TERMS & CONDITIONS
            // ======================

            doc
                .fontSize(12)
                .fillColor(COLOR.maroon)
                .text("Terms & Conditions", 40, y);

            y += 18;

            doc.fontSize(9).fillColor(COLOR.ink);
            doc.text("•  Goods once sold will not be taken back except for manufacturing defects.", 40, y);
            doc.text("•  Warranty is applicable strictly as per company policy.", 40, y + 14);
            doc.text("•  This is a computer-generated invoice and does not require a physical signature.", 40, y + 28);

            y += 55;

            // ======================
            // FOOTER BAND
            // ======================

            doc.rect(0, y, doc.page.width, doc.page.height - y).fill(COLOR.maroon);
            doc.rect(0, y, doc.page.width, 3).fill(COLOR.gold);

            y += 22;

            doc
                .fontSize(13)
                .fillColor(COLOR.gold)
                .text("STTYTT TECHNOLOGIES PVT. LTD.", 40, y, { width: 515, align: "center" });

            y += 20;

            doc
                .fontSize(9)
                .fillColor("#F8E8B0")
                .text("Sustainable Electric Mobility Store", 40, y, { width: 515, align: "center" });

            y += 18;

            doc
                .fillColor("#FFFFFF")
                .text(
               "Email: sttytt.com@gmail.com  |  Website: www.sttytt.com  |  Phone: +91 8480114554  |  Bhubaneswar, Odisha",
                40, y, { width: 515, align: "center" }
            );

            y += 22;
            
            
            doc
                .fontSize(8)
                .fillColor("#D7C18A")
                .text(
                    "© 2026 STTYTT Technologies Pvt. Ltd. All Rights Reserved.",
                    40, y, { width: 515, align: "center" }
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
app.put("/api/admin/order-status/:id", verifyToken, verifyAdmin, (req, res) => {

    const { status } = req.body;
    const orderId = req.params.id;

    let dateField = "";

    switch(status){

        case "Confirmed":
            dateField = "confirmed_at";
            break;

        case "Shipped":
            dateField = "shipped_at";
            break;

        case "Out For Delivery":
            dateField = "out_for_delivery_at";
            break;

        case "Delivered":
            dateField = "delivered_at";
            break;

        case "Cancelled":
            dateField = "cancelled_at";
            break;
    }

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

            let sql;

            if(dateField){

                sql = `UPDATE orders
                SET order_status=?,
                ${dateField}=NOW()
                WHERE id=?`;

            }else{

                sql = `UPDATE orders
                SET order_status=?
                WHERE id=?`;

            }

            db.query(

    sql,

    [status, orderId],

    ()=>{

        let message = `Your order ${order.tracking_id} is now ${status}.`;

        if(status === "Confirmed"){
            message += "\nYour order has been confirmed.";
        }

        if(status === "Shipped"){
            message += "\nYour order has been shipped.";
        }

        if(status === "Out For Delivery"){
            message += "\nYour order is out for delivery and should arrive today.";
        }

        if(status === "Delivered"){
            message += "\nYour order has been delivered successfully.";
        }

        if(status === "Cancelled"){
            message += "\nYour order has been cancelled.";
        }
        

        if(order.estimated_delivery){

    message += `

Estimated Delivery:
${new Date(order.estimated_delivery).toLocaleDateString()}`;

}



        createNotification(

            order.user_email,

            "Order Update",

            message

        );

        res.json({
            success:true
        });

    }

);
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
        district,
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