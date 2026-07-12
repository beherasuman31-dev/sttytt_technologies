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



// LOGIN LOGOUT
const loginLogoutBtn = document.getElementById("loginLogoutBtn");

const token = localStorage.getItem("token");

if(token){
    loginLogoutBtn.innerText = "Logout";
    loginLogoutBtn.href = "#";
}else{
    loginLogoutBtn.innerText = "Login";
    loginLogoutBtn.href = "login.html";
}

loginLogoutBtn.addEventListener("click", async function(e){

    if(localStorage.getItem("token")){

        e.preventDefault();

        try{

            await fetch("http://localhost:5000/api/logout",{
                method:"POST",
                headers:{
                    Authorization:"Bearer " + localStorage.getItem("token")
                }
            });

        }catch(err){
            console.log(err);
        }

        localStorage.removeItem("token");

        alert("Logout Successful");

        window.location.href="index.html";
    }

});




// ================= NAVBAR SHADOW =================

window.addEventListener("scroll",()=>{

    const navbar =
    document.querySelector("header");

    if(!navbar) return;

    if(window.scrollY > 10){

        navbar.style.boxShadow =
        "0 2px 10px rgba(0,0,0,0.1)";

    }else{

        navbar.style.boxShadow = "none";
    }
});


// ================= CARD CLICK =================

document.querySelectorAll(".card").forEach(card=>{

    card.addEventListener("click",()=>{

        alert(
            card.querySelector("h3").innerText +
            " clicked"
        );
    });
});


// ================= CART COUNT =================

async function updateCartCount(){

    try{

        const token =
        localStorage.getItem("token");

        if(!token){

            const cartCount =
            document.getElementById("cart-count");

            if(cartCount){

                cartCount.innerText = "0";
            }

            return;
        }

        const response = await fetch(

            "http://localhost:5000/api/cart",

            {

                method:"GET",

                headers:{
                    Authorization: token
                }
            }
        );

        const data =
        await response.json();

        let total = 0;

        if(Array.isArray(data)){

            data.forEach(item=>{

                total +=
                Number(item.quantity || 0);
            });
        }

        const cartCount =
        document.getElementById("cart-count");

        if(cartCount){

            cartCount.innerText = total;
        }

    }catch(error){

        console.log(
            "Cart Count Error",
            error
        );
    }
}


// ================= NOTIFICATION COUNT =================

async function loadNotificationCount(){



    try{

        const token =
        localStorage.getItem("token");

        if(!token){

            return;
        }

        const response = await fetch(

            "http://localhost:5000/api/notification-count",

            {

                method:"GET",

                headers:{
                    Authorization: token
                }
            }
        );

        const data =
        await response.json();

        const badge =
        document.querySelector(
            ".notification-count"
        );

        if(badge){

            badge.innerText =
            data.count || 0;
        }

    }catch(error){

        console.log(
            "Notification Error",
            error
        );
    }
}




// ================= FEATURED PRODUCTS =================

async function loadFeaturedProducts(){

    try{

        const response = await fetch(
            "http://localhost:5000/api/products"
        );

        const products = await response.json();

        const container =
        document.getElementById("featuredModels");

        if(!container) return;

        container.innerHTML = "";

          products
         .sort((a,b)=>
          new Date(b.created_at)-new Date(a.created_at)
                             )
                          .slice(0,3)
                       .forEach(product=>{

            container.innerHTML += `

            <div class="model-card">

                <div class="model-image">

                    <img
                    src="http://localhost:5000${product.image}"
                    alt="${product.name}">

                </div>

                <div class="model-content">

                    <h3>${product.name}</h3>

                    <div class="specs">

                        <span>${product.battery}</span>

                        <span>${product.range_km}</span>

                        <span>${product.speed}</span>

                        <span>${product.fast_charging_hours}</span>


                    </div>

                    <div class="model-footer">

                        <h4>₹${product.price}</h4>

                        <button class="card-btn">

                            NEW MODEL

                        </button>

                    </div>

                </div>

            </div>

            `;

        });

    }catch(err){

        console.log(err);

    }

}

loadFeaturedProducts();

// Reviews

const reviewForm = document.getElementById("reviewForm");

if(reviewForm){

reviewForm.addEventListener("submit", async function(e){

e.preventDefault();

const token = localStorage.getItem("token");

const formData = {
name: this.querySelector('input[type="text"]').value,
email: this.querySelector('input[type="email"]').value,
subject: this.querySelectorAll("input")[2].value,
message: this.querySelector("textarea").value
};

const response = await fetch("http://localhost:5000/api/reviews",{

method:"POST",

headers:{
"Content-Type":"application/json",
Authorization: token
},

body: JSON.stringify(formData)

});

const data = await response.json();

alert(data.message);

this.reset();

});

}





// ================= EXPLORE & BROWSE =================

const exploreBtn = document.getElementById("exploreBtn");
const browseBtn = document.getElementById("browseBtn");

function checkLoginAndRedirect(e){

    e.preventDefault();

    const token = localStorage.getItem("token");

    if(token){

        window.location.href = "product.html";

    }else{

        window.location.href = "login.html";
    }
}

if(exploreBtn){
    exploreBtn.addEventListener("click", checkLoginAndRedirect);
}

if(browseBtn){
    browseBtn.addEventListener("click", checkLoginAndRedirect);
}



// ================= AUTO REFRESH =================

window.addEventListener(
    "storage",
    updateCartCount
);


// ================= INIT =================

updateCartCount();

loadNotificationCount();


// HERO STATES
const heroStats = document.getElementById("heroStats");

fetch("http://localhost:5000/api/hero-stats")

.then(res=>res.json())

.then(data=>{

heroStats.innerHTML="";

data.forEach(item=>{

heroStats.innerHTML += `

<div>

<h3>${item.value}</h3>

<p>${item.title}</p>

</div>

`;

});

});