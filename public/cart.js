// =========================
// cart.js
// =========================

const token = localStorage.getItem("token");

const cartContainer =
document.getElementById("cartContainer");

const subtotalElement =
document.getElementById("subtotal");

const totalPriceElement =
document.getElementById("totalPrice");

const checkoutBtn =
document.querySelector(".checkout-btn");

let shipping = 500;
let cartData = [];


// ================= LOAD CART =================

async function loadCart(){

    try{

        const response = await fetch(

            "http://localhost:5000/api/cart",

            {
                headers:{
                    Authorization: token
                }
            }
        );

        const data = await response.json();

        cartData = data;

        cartContainer.innerHTML = "";

        let subtotal = 0;

        if(!data || data.length === 0){

            cartContainer.innerHTML = `

            <div class="empty-cart">

                Your cart is empty

            </div>

            `;

            subtotalElement.innerText = "₹0";
            totalPriceElement.innerText = "₹0";

            return;
        }

        data.forEach(item=>{

            subtotal +=
            Number(item.product_price) *
            Number(item.quantity);

            cartContainer.innerHTML += `

            <div class="cart-card">

                <div class="cart-product">

                    <img src="${item.product_image}">

                    <div class="cart-details">

                        <h2>
                            ${item.product_name}
                        </h2>

                        <p>
                            Quantity :
                            ${item.quantity}
                        </p>

                        <div class="quantity-box">

                            <button
                            class="quantity-btn"

                            onclick="decreaseQty(
                            ${item.id},
                            ${item.quantity}
                            )">

                            -

                            </button>

                            <span class="quantity-number">

                                ${item.quantity}

                            </span>

                            <button
                            class="quantity-btn"

                            onclick="increaseQty(
                            ${item.id},
                            ${item.quantity}
                            )">

                            +

                            </button>

                        </div>

                        <button
                        class="remove-btn"

                        onclick="removeItem(${item.id})">

                        Remove

                        </button>

                    </div>

                </div>

                <div class="cart-price">

                    ₹${item.product_price}

                </div>

            </div>

            `;
        });

        subtotalElement.innerText =
        `₹${subtotal}`;

        totalPriceElement.innerText =
        `₹${subtotal + shipping}`;

    }

    catch(err){

        console.log("LOAD CART ERROR");
        console.log(err);
    }
}



// ================= REMOVE ITEM =================

async function removeItem(id){

    try{

        await fetch(

            `http://localhost:5000/api/cart/${id}`,

            {

                method:"DELETE",

                headers:{
                    Authorization: token
                }
            }
        );

        loadCart();

    }catch(err){

        console.log(err);
    }
}



// ================= INCREASE =================

async function increaseQty(id,qty){

    try{

        qty++;

        await fetch(

            `http://localhost:5000/api/cart/${id}`,

            {

                method:"PUT",

                headers:{

                    "Content-Type":"application/json",
                    Authorization: token
                },

                body:JSON.stringify({

                    quantity:qty
                })
            }
        );

        loadCart();

    }catch(err){

        console.log(err);
    }
}



// ================= DECREASE =================

async function decreaseQty(id,qty){

    if(qty <= 1){

        return;
    }

    try{

        qty--;

        await fetch(

            `http://localhost:5000/api/cart/${id}`,

            {

                method:"PUT",

                headers:{

                    "Content-Type":"application/json",
                    Authorization: token
                },

                body:JSON.stringify({

                    quantity:qty
                })
            }
        );

        loadCart();

    }catch(err){

        console.log(err);
    }
}



// ================= CHECKOUT =================

if(checkoutBtn){

    checkoutBtn.addEventListener(

        "click",

        ()=>{

            localStorage.setItem(

                "checkoutItems",

                JSON.stringify(cartData)
            );

            window.location.href =
            "checkout.html";
        }
    );
}



// ================= INITIAL LOAD =================

loadCart();