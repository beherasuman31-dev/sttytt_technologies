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

let cartData = [];


// ================= LOAD CART =================

async function loadCart(){

    try{

        const response = await fetch(

            "/api/cart",

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

            🛒

Your Cart is Empty

Continue Shopping

            </div>

            `;

             subtotalElement.innerText="₹0";

    totalPriceElement.innerText="₹0";
            return;
        }

        data.forEach(item=>{

            subtotal +=
            Number(item.product_price) *
            Number(item.quantity);

            cartContainer.innerHTML += `

            <div class="cart-card">


                <div class="checkbox-box">

        <input
            type="checkbox"
            class="cart-checkbox"
            data-id="${item.id}"
            checked>

    </div>

                <div class="cart-product">
                 <img src="${item.product_image}" class="cart-img">

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

                            <span class="quantity-number" id="qty-${item.id}" >

                                ${item.quantity}

                            </span>

                            <button
class="quantity-btn"
onclick="increaseQty(${item.id}, ${item.quantity})">
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

                <div class="cart-price" id="price-${item.id}">

                    ₹${item.product_price}

                </div>

            </div>

            `;
        });

        document.querySelectorAll(".cart-checkbox").forEach(box=>{

    box.addEventListener("change",updateSummary);

});

updateSummary();


    }

    catch(err){

        console.log("LOAD CART ERROR");
        console.log(err);
    }
}

// ================= CHECKOUT =================

if(checkoutBtn){

    checkoutBtn.addEventListener("click",()=>{

        const selectedIds=[];

        document.querySelectorAll(".cart-checkbox").forEach(box=>{

            if(box.checked){

                selectedIds.push(Number(box.dataset.id));

            }

        });

        if(selectedIds.length===0){

            alert("Please select at least one product.");

            return;

        }

        localStorage.setItem(

            "selectedCartIds",

            JSON.stringify(selectedIds)

        );

        window.location.href="checkout.html";

    });

}



// ================= REMOVE ITEM =================

async function removeItem(id){

    try{

        await fetch(

            `/api/cart/${id}`,

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

            `/api/cart/${id}`,

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

          const item = cartData.find(p => p.id == id);

item.quantity = qty;

document.getElementById(`qty-${id}`).innerText = qty;

document.getElementById(`price-${id}`).innerText =
`₹${item.product_price * qty}`;

updateSummary();

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

            `/api/cart/${id}`,

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

        const item = cartData.find(p => p.id == id);

item.quantity = qty;

document.getElementById(`qty-${id}`).innerText = qty;

document.getElementById(`price-${id}`).innerText =
`₹${item.product_price * qty}`;

updateSummary();

    }catch(err){

        console.log(err);
    }
}


function updateSummary(){

    let subtotal=0;

    document.querySelectorAll(".cart-checkbox").forEach(box=>{

        if(box.checked){

            const item=cartData.find(

                p=>p.id==box.dataset.id

            );

            if(item){

                subtotal+=
                Number(item.product_price)*
                Number(item.quantity);

            }

        }

    });

    subtotalElement.innerText=`₹${subtotal}`;

    totalPriceElement.innerText=`₹${subtotal}`;
       // Buy Now button enable/disable
    checkoutBtn.disabled = (subtotal === 0);

}





// ================= INITIAL LOAD =================

loadCart();