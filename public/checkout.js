// =========================
// CHECKOUT.JS
// =========================

const token = localStorage.getItem("token");

console.log("TOKEN => ", token);


// ================= LOAD ADDRESS =================

async function loadAddress(){

    try{

        const res = await fetch(

            "http://localhost:5000/api/user-data",

            {

                method:"GET",

                headers:{

                    "Content-Type":"application/json",

                    Authorization: token
                }
            }
        );

        const data = await res.json();

        console.log("USER DATA => ", data);


        if(!data.success){

            document.getElementById(
                "addressBox"
            ).innerHTML = "Address Not Found";

            return;
        }


        const user = data.user;


        document.getElementById(
            "addressBox"
        ).innerHTML = `

            <h3>${user.name || ""}</h3>

            <p>
                ${user.address || ""},
                ${user.city || ""},
                ${user.state || ""}
                - ${user.pincode || ""}
            </p>

            <p>${user.phone || ""}</p>
        `;


        // ================= PREFILL =================

        document.getElementById("name").value =
        user.name || "";

        document.getElementById("phone").value =
        user.phone || "";

        document.getElementById("address").value =
        user.address || "";

        document.getElementById("city").value =
        user.city || "";

        document.getElementById("state").value =
        user.state || "";

        document.getElementById("pincode").value =
        user.pincode || "";

    }catch(error){

        console.log(error);

        document.getElementById(
            "addressBox"
        ).innerHTML =
        "Failed To Load Address";
    }
}



// ================= LOAD CHECKOUT ITEMS =================

async function loadCheckoutItems(){

    try{

        const res = await fetch(

            "http://localhost:5000/api/cart",
            {
                headers:{
                    Authorization:token}
                }
        )
        

        const data = await res.json();

        const container =
        document.getElementById(
            "checkoutItems"
        );

        container.innerHTML = "";

        let subtotal = 0;


        data.forEach(item=>{

            subtotal +=
            item.product_price *
            item.quantity;


            container.innerHTML += `

            <div class="checkoutItem">

                <img src="${item.product_image}">

                <div class="itemDetails">

                    <h2>
                        ${item.product_name}
                    </h2>

                    <div class="price">
                        ₹${item.product_price}
                    </div>

                    <div class="qty">
                        Quantity: ${item.quantity}
                    </div>

                </div>

            </div>

            `;
        });


        document.getElementById(
            "subtotal"
        ).innerText =
        `₹${subtotal}`;


        document.getElementById(
            "finalTotal"
        ).innerText =
        `₹${subtotal}`;

    }catch(error){

        console.log(error);
    }
}



// ================= EDIT ADDRESS =================

document.getElementById(

    "editBtn"

).addEventListener("click",()=>{

    document.getElementById(
        "addressModal"
    ).style.display = "flex";
});



// ================= SAVE ADDRESS =================

document.getElementById(

    "saveAddress"

).addEventListener(

    "click",

    async()=>{

        try{

            const body = {

                name:
                document.getElementById("name").value,

                phone:
                document.getElementById("phone").value,

                address:
                document.getElementById("address").value,

                city:
                document.getElementById("city").value,

                state:
                document.getElementById("state").value,

                pincode:
                document.getElementById("pincode").value
            };


            console.log("BODY => ", body);


            const res = await fetch(

                "http://localhost:5000/api/update-profile",

                {

                    method:"POST",

                    headers:{

                        "Content-Type":"application/json",

                        Authorization: token
                    },

                    body:JSON.stringify(body)
                }
            );


            const data = await res.json();

            console.log("UPDATE RESPONSE => ", data);


            if(data.success){

                alert("Address Updated Successfully");


                document.getElementById(
                    "addressModal"
                ).style.display = "none";


                loadAddress();

            }else{

                alert(data.message);
            }

        }catch(error){

            console.log(error);

            alert("Update Failed");
        }
    }
);



// ================= PLACE ORDER =================

document.getElementById(
    "placeOrderBtn"
).addEventListener(
    "click",
    async () => {

        try {

            const paymentMethod =
            document.querySelector(
                'input[name="payment"]:checked'
            ).value;

            // COD

            if (paymentMethod === "COD") {

                await placeOrder("COD");

                return;
            }

            // Razorpay

            const total = Number(
                document.getElementById(
                    "finalTotal"
                ).innerText.replace("₹", "")
            );

            const options = {

                key: "rzp_test_T591J8J71XfrC3",

                amount: total * 100,

                currency: "INR",

                name: "STTYTT Bikes",

                description: "Bike Order Payment",

              config: {
        display: {
            blocks: {
                preferred: {
                    name: "Payment Methods",
                    instruments: [
                        {
                            method: "upi"
                        },
                        {
                            method: "card"
                        },
                        {
                            method: "netbanking"
                        }
                    ]
                }
            },

            sequence: [
                "block.preferred"
            ],

            preferences: {
                show_default_blocks: false
            }
        }
    },

                handler: async function(response){

                    await placeOrder(

                        "RAZORPAY",

                        response.razorpay_payment_id
                    );
                },

                theme: {
                    color: "#ff6600"
                }
            };

            const rzp =
            new Razorpay(options);

            rzp.open();

        } catch(error){

            console.log(error);

            alert("Payment Failed");
        }
    }
);


// ================= ORDER FUNCTION =================

async function placeOrder(
    paymentMethod,
    paymentId = null
){

    try{

        const res = await fetch(

            "http://localhost:5000/api/place-order",

            {

                method:"POST",

                headers:{

                    "Content-Type":"application/json",

                    Authorization: token
                },

                body:JSON.stringify({

                    payment_method:
                    paymentMethod,

                    payment_id:
                    paymentId
                })
            }
        );

        const data =
        await res.json();

        if(data.success){

            alert(
                "Order Placed Successfully"
            );

            window.location.href =
            "orders.html";

        }else{

            alert(data.message);
        }

    }catch(error){

        console.log(error);

        alert("Order Failed");
    }
}


// ======================
// UPI DROPDOWN
// ======================

const upiToggle =
document.getElementById("upiToggle");

const upiApps =
document.getElementById("upiApps");


upiToggle.addEventListener("click",()=>{

    if(upiApps.style.display === "block"){

        upiApps.style.display = "none";
    }

    else{

        upiApps.style.display = "block";
    }
});




// ======================
// PAY FUNCTION
// ======================

function payUPI(app){

    // TOTAL AMOUNT

    const totalText =
    document.getElementById("finalTotal").innerText;

    const amount =
    totalText.replace("₹","");


    const upiId =
    "sttyttbikes@upi";

    const name =
    "STTYTT Bikes";


    let url =
`upi://pay?pa=${upiId}&pn=${name}&am=${amount}&cu=INR`;



    // OPEN PAYMENT APP

    window.location.href = url;
}







// ================= INIT =================

loadAddress();

loadCheckoutItems();