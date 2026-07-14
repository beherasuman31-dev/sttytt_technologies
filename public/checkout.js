// =========================
// CHECKOUT.JS
// =========================

const token = localStorage.getItem("token");

console.log("TOKEN => ", token);






// ================= LOAD ADDRESS =================

async function loadAddress(){

    try{

        const res = await fetch(

            "/api/user-data",

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


        document.getElementById("addressBox").innerHTML = `
            <h3>${user.name || ""}</h3>

            <p>
                ${user.address || ""},
                ${user.district || ""},
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

         document.getElementById("nearby").value =
        user.nearby || "";

        document.getElementById("district").value =
        user.district || "";

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

       const cartIds = JSON.parse(
localStorage.getItem("selectedCartIds")
) || [];


const container = document.getElementById("checkoutItems");

container.innerHTML = `
<div class="loading">
Loading Checkout Items...
</div>
`;

const res = await fetch(

"/api/checkout-summary",

{

method:"POST",

headers:{

"Content-Type":"application/json",

Authorization:token

},

body:JSON.stringify({

cartIds

})

}

);




const result = await res.json();

const data = result.items;
container.innerHTML = "";

if(!result.success){

    return;

}

data.forEach(item=>{

    container.innerHTML += `
  

    <div class="checkoutItem">

        <img src="${item.product_image}">

        <div class="itemDetails">

            <h2>${item.product_name}</h2>

            <div class="price">

                ₹${item.product_price}

            </div>

            <div class="qty">

                Quantity : ${item.quantity}

            </div>

        </div>

    </div>

    `;

});

document.getElementById("subtotal").innerText =
`₹${result.subtotal}`;

document.getElementById("shippingCharge").innerText =
`₹${result.shipping}`;

document.getElementById("finalTotal").innerText =
`₹${result.total}`;


    }

    catch(error){

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

                 nearby:
                document.getElementById("nearby").value,


                district:
                document.getElementById("district").value,

                state:
                document.getElementById("state").value,

                pincode:
                document.getElementById("pincode").value
            };


            console.log("BODY => ", body);


            const res = await fetch(

                "/api/update-profile",

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

            



    await Promise.all([
        loadAddress(),
        loadCheckoutItems()
    ]);

}else{

    alert(data.message);

}

}catch(error){

    console.log(error);

    alert("Update Failed");

}

});





document.getElementById("pincode")

.addEventListener(

"blur",

async()=>{

const pincode=

document.getElementById("pincode")

.value.trim();

if(pincode.length!==6){

return;

}

try{

const res=

await fetch(

`https://api.postalpincode.in/pincode/${pincode}`

);

const data=

await res.json();

if(

data[0].Status==="Success"

){

const office=

data[0].PostOffice[0];

document.getElementById("state").innerHTML=

`<option value="${office.State}" selected>

${office.State}

</option>`;

document.getElementById("district").innerHTML=

`<option value="${office.District}" selected>

${office.District}

</option>`;

}

else{

alert("Invalid Pincode");

}

}

catch(error){

console.log(error);

}

});



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


          if (paymentMethod === "QR") {

    const utr = document
        .getElementById("utrNumber")
        .value
        .trim();

    if (!utr) {
        alert("Please enter Transaction ID / UTR Number");
        return;
    }

    await placeOrder("QR",null, utr);

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

                name: "STTYTT Cycle",

                description: "Cycle Order Payment",

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
                    color: "#3D0000"
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
const cartIds = JSON.parse(

localStorage.getItem("selectedCartIds")

) || [];
async function placeOrder(
    paymentMethod,
    paymentId = null,
    utr = null

){

    try{

        const res = await fetch(

            "/api/place-order",

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
                    paymentId,

                     utr_number: utr,

                    cartIds

                    
                })
            }
        );

        const data =
        await res.json();

        if(data.success){
             localStorage.removeItem(

        "selectedCartIds"

    );

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



const qrRadio =
document.querySelector('input[value="QR"]');

const codRadio =
document.querySelector('input[value="COD"]');

const upiRadio =
document.querySelector('input[value="UPI"]');

const qrBox =
document.getElementById("qrBox");

qrRadio.onchange = () => {

    qrBox.style.display = "block";

};

codRadio.onchange = () => {

    qrBox.style.display = "none";

};

upiRadio.onchange = () => {

    qrBox.style.display = "none";

};






async function init(){

    document.getElementById("addressBox").innerHTML =
    "Loading Address...";

    document.getElementById("checkoutItems").innerHTML =
    "Loading Checkout Items...";

    await Promise.all([
        loadAddress(),
        loadCheckoutItems()
    ]);
}

init();