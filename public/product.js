// =========================
// products.js
// =========================




// ================= MOBILE MENU =================

const menuIcon =
document.getElementById("menu-icon");

const navLinks =
document.querySelector(".nav-links");

if(menuIcon){

    menuIcon.addEventListener("click",()=>{

        navLinks.classList.toggle("active");
    });
}

document.addEventListener("click",(e)=>{

    if(
        navLinks &&
        !navLinks.contains(e.target) &&
        !menuIcon.contains(e.target)
    ){

        navLinks.classList.remove("active");
    }
});




const productsContainer =
document.getElementById("productsContainer");

const searchInput =
document.getElementById("searchInput");

const categoryFilter =
document.getElementById("categoryFilter");

const priceFilter =
document.getElementById("priceFilter");

const sortFilter =
document.getElementById("sortFilter");

const modal =
document.getElementById("productModal");

const modalData =
document.getElementById("modalData");

const closeModal =
document.getElementById("closeModal");

let products = [];


// ================= FETCH PRODUCTS =================

async function fetchProducts(){

    try{

        const response = await fetch(

            "/api/products"
        );

        products = await response.json();

        displayProducts(products);

    }catch(err){

        console.log(err);
    }
}

fetchProducts();


// ================= DISPLAY PRODUCTS =================

function displayProducts(items){

    productsContainer.innerHTML = "";


    items.forEach(product => {

        productsContainer.innerHTML += `

        <div class="product-card">

            <div class="product-image">

                <img src="${product.image}" alt="">

            </div>

            <div class="product-content">

                <span class="product-category">

                    ${product.category}

                </span>

                <h2 class="product-title">

                    ${product.name}

                </h2>

                <p class="product-description">

                    ${product.description}

                </p>

                <div class="features">

                    <span class="feature-tag">
                        ${product.speed}
                    </span>

                    <span class="feature-tag">
                        ${product.range_km}
                    </span>

                    <span class="feature-tag">
                        ${product.battery}
                    </span>

                    <span class="feature-tag">
                        ${product.warranty}
                    </span>

                    <span class="feature-tag">
                        ${product.fast_charging_hours}
                    </span>

                    <span class="feature-tag">
                        ${product.brake_type}
                    </span>


                </div>

                <div class="product-footer">

                    <div class="product-price">

   ${
    isSaleActive(product)
    ? `
        <span style="text-decoration:line-through;color:#888">
            ₹${product.original_price}
        </span><br>

        <span style="color:#c62828;font-size:22px;font-weight:bold">
            ₹${getDiscountedPrice(product)}
        </span>

        <span style="background:red;color:#fff;padding:3px 8px;border-radius:5px;font-size:12px">
            ${product.discount_type==="percentage"
                ? product.discount_value+"% OFF"
                : "₹"+product.discount_value+" OFF"}
        </span>
        `
        :
        `₹${product.price}`
    }

</div>

                    <button
                    class="view-btn"

                    onclick="showDetails(${product.id})">

                    View

                    </button>

                </div>

            </div>

        </div>

        `;
    });
}


// ================= FILTER PRODUCTS =================

function filterProducts(){

    let filtered = [...products];

    const searchValue =
    searchInput.value.toLowerCase();

    const categoryValue =
    categoryFilter.value;

    const priceValue =
    priceFilter.value;

    const sortValue =
    sortFilter.value;


    filtered = filtered.filter(product =>

        product.name
        .toLowerCase()
        .includes(searchValue)
    );


    if(categoryValue){

        filtered = filtered.filter(product =>

            product.category === categoryValue
        );
    }


    if(priceValue){

        filtered = filtered.filter(product =>

            product.price <= Number(priceValue)
        );
    }


    if(sortValue === "low"){

        filtered.sort(

            (a,b)=>a.price-b.price
        );

    }else if(sortValue === "high"){

        filtered.sort(

            (a,b)=>b.price-a.price
        );
    }

    displayProducts(filtered);
}


// ================= EVENTS =================

searchInput.addEventListener(

    "input",
    filterProducts
);

categoryFilter.addEventListener(

    "change",
    filterProducts
);

priceFilter.addEventListener(

    "change",
    filterProducts
);

sortFilter.addEventListener(

    "change",
    filterProducts
);


// ================= PRODUCT MODAL =================

function showDetails(id){

    const product =
    products.find(p => p.id === id);


    modal.style.display = "flex";


    modalData.innerHTML = `

    <div class="product-details-page">

        <!-- LEFT -->

        <div class="details-left">

            <div class="main-image">

    <img
    id="mainProductImage"
    src="${product.image}"
    alt="">

</div>

<div class="thumbnail-row">

    <img
    src="${product.image}"
    onclick="changeImage('${product.image}')">

    ${product.image2 ? `
    <img
    src="${product.image2}"
    onclick="changeImage('${product.image2}')">
    ` : ""}

    ${product.image3 ? `
    <img
    src="${product.image3}"
    onclick="changeImage('${product.image3}')">
    ` : ""}

    ${product.image4 ? `
    <img
    src="${product.image4}"
    onclick="changeImage('${product.image4}')">
    ` : ""}

</div>
        </div>


        <!-- RIGHT -->

        <div class="details-right">

            <span class="detail-category">Catagory:

                ${product.category}

            </span>

            <h1 class="detail-title">Name:

                ${product.name}

            </h1>

            <div class="rating">Rating:

                ★★★★★

            </div>

            <h2 class="detail-price">

${
isSaleActive(product)
?
`
<span style="text-decoration:line-through;color:#888">
₹${product.original_price}
</span><br>

<span style="color:#c62828;font-size:30px;font-weight:bold">
₹${getDiscountedPrice(product)}
</span>

<span style="background:red;color:#fff;padding:4px 10px;border-radius:5px;font-size:13px">
${product.discount_type==="percentage"
?product.discount_value+"% OFF"
:"₹"+product.discount_value+" OFF"}
</span>
`
:
`₹${product.price}`
}

</h2>

            <p class="detail-description">

                ${product.description}

            </p>

            <div class="detail-features">

                <span>Speed:
                    ${product.speed}
                </span>

                <span>Range:
                    ${product.range_km}
                </span>

                <span>Battery:
                    ${product.battery}
                </span>

                 <span>Warranty:
                    ${product.warranty}
                </span>

                 <span>Charging_Hour:
                    ${product.fast_charging_hours}
                </span>

                 <span>Break_Type:
                    ${product.brake_type}
                </span>

            </div>


            <!-- QUANTITY -->

            <div class="quantity-box">

                <button
                onclick="decreaseQty()">

                -

                </button>

                <input

                    type="text"

                    value="1"

                    id="qtyInput"

                    readonly
                >

                <button
                onclick="increaseQty()">

                +

                </button>

            </div>


            <!-- BUTTONS -->

            <div class="detail-buttons">
            <button class="cart-btn"
             onclick="addToCart(
                    ${product.id},
                    \`${product.name}\`,
                    ${getDiscountedPrice(product)},
                    \`${product.image}\`,
                    \`${product.image}\` )"> Add To Cart </button>

                              <button
class="share-btn"
onclick="shareProduct(
 \`${product.name}\`,
${getDiscountedPrice(product)},
window.location.href
)">
<i class='bx bx-share-alt'></i>
Share
</button>
                </div>
          

        </div>

        

    </div>


    <!-- DESCRIPTION -->

    <div class="product-extra">

        <h2>
            Description
        </h2>

        <p>

            ${product.description}

            Premium electric cycle designed
            for urban and sport riding.

            Smooth acceleration,
            high battery backup and
            futuristic design.

        </p>

    </div>

    `;
}


// ================= CLOSE MODAL =================

closeModal.onclick = ()=>{

    modal.style.display = "none";
}


window.onclick = (e)=>{

    if(e.target == modal){

        modal.style.display = "none";
    }
}


// ================= QUANTITY =================

function increaseQty(){

    const qtyInput =
    document.getElementById("qtyInput");

    let qty =
    Number(qtyInput.value);

    qty++;

    qtyInput.value = qty;
}


function decreaseQty(){

    const qtyInput =
    document.getElementById("qtyInput");

    let qty =
    Number(qtyInput.value);


    if(qty > 1){

        qty--;

        qtyInput.value = qty;
    }
}


// ================= ADD TO CART =================

async function addToCart(
    id,
    name,
    price,
    image
){

    const token =
    localStorage.getItem("token");

    if(!token){

        alert("Please Login First");
        return;
    }

    const qtyInput =
    document.getElementById("qtyInput");

    const quantity =
    qtyInput ? qtyInput.value : 1;

    try{

        const response = await fetch(

            "/api/cart",

            {

                method:"POST",

                headers:{

                    "Content-Type":"application/json",

                    Authorization:`Bearer ${token}`
                },

                body:JSON.stringify({

                    product_id:id,

                    product_name:name,

                    product_price:price,

                    product_image:image,

                    quantity
                })
            }
        );

        const data =
        await response.json();

        console.log(data);

        alert(data.message);

        updateCartCount();

    }catch(err){

        console.log(err);

        alert("Cart Error");
    }
}

// ================= CART COUNT =================

async function updateCartCount(){

    try{

        const token =
        localStorage.getItem("token");

        if(!token){

            return;
        }

        const response = await fetch(

            "/api/cart",

            {

                headers:{
                    Authorization: token
                }
            }
        );

        const data =
        await response.json();

        const cartCount =
        document.getElementById("cart-count");

        let total = 0;

        if(Array.isArray(data)){

            data.forEach(item=>{

                total += Number(item.quantity);
            });
        }

        if(cartCount){

            cartCount.innerText = total;
        }

    }catch(err){

        console.log(err);
    }
}

updateCartCount();


// Orders
async function buyNow(product){

   await fetch("/api/orders",{

      method:"POST",

      headers:{
         "Content-Type":"application/json"
      },

      body:JSON.stringify({

         user_id:1,

         product_id:product.id,

         product_name:product.name,

         product_image:product.image,

         product_price:product.price,

         quantity:1,

         total_price:product.price,

         customer_name:"Happy",

         phone:"9999999999",

         address:"Bhubaneswar",

         district:"Khorda",

         pincode:"751001",

         payment_method:"COD"
      })
   });

   window.location.href =
   "/orders/orders.html";
}



function changeImage(image){

    document.getElementById(
        "mainProductImage"
    ).src = "" + image;

}


async function shareProduct(name, price, url) {
    const shareData = {
        title: name,
        text: `🛍️ ${name}\n💰 Price: ₹${price}\n\nCheck this amazing product 👇`,
        url: url
    };

    // Native share (mobile/supported browsers)
    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            if (err.name !== "AbortError") {
                console.error("Share failed:", err);
                fallbackCopy(url);
            }
        }
    } else {
        fallbackCopy(url);
    }
}

async function fallbackCopy(url) {
    try {
        await navigator.clipboard.writeText(url);
        showToast("✅ Link copied to clipboard!");
    } catch (err) {
        console.error("Copy failed:", err);
        showToast("❌ Could not copy link");
    }
}

function showToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: #1f1f1f;
        color: #fff;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: fadeInOut 2.5s ease forwards;
    `;

    const style = document.createElement("style");
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, 10px); }
            10% { opacity: 1; transform: translate(-50%, 0); }
            90% { opacity: 1; }
            100% { opacity: 0; transform: translate(-50%, 10px); }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
        style.remove();
    }, 2500);
}