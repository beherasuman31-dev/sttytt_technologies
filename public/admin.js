
// ================= DRAWER TOGGLE =================

function toggleDrawer(){
    document.getElementById("sideDrawer").classList.toggle("open");
    document.getElementById("drawerOverlay").classList.toggle("active");
}


const token = localStorage.getItem("token");
const productForm = document.getElementById("productForm");
const productTableBody = document.getElementById("productTableBody");
const dealershipForm =
document.getElementById("dealershipForm");

const dealershipTable =
document.getElementById("dealershipTable");
// ================= STATUS BADGE HELPER =================

function statusBadgeClass(status){
    const map = {
        "Processing": "status-processing",
        "Confirmed": "status-confirmed",
        "Shipped": "status-shipped",
        "Out For Delivery": "status-out-for-delivery",
        "Delivered": "status-delivered",
        "Cancelled": "status-cancelled"
    };
    return map[status] || "status-processing";
}

// ================= FETCH PRODUCTS =================

async function fetchProducts(){

    try{

        const response = await fetch(
            "/api/products",
            {
                headers:{
                    Authorization:"Bearer " + token
                }
            }
        );

        const products = await response.json();

        productTableBody.innerHTML = "";

        products.forEach(product=>{

            productTableBody.innerHTML += `
            <tr>

                <td data-label="Image">
                    <img src="${product.image}" width="80">
                </td>

                <td data-label="Name">${product.name}</td>

                <td data-label="Price" class="price-cell">₹${product.price}</td>

                <td data-label="Category">${product.category}</td>

                <td data-label="Action">
                        <button class="edit-btn"
        onclick="editProduct(${product.id})">
        Edit
    </button>

                    <button class="delete-btn" onclick="deleteProduct(${product.id})">
                        Delete
                    </button>
                </td>

            </tr>
            `;
        });

        const countEl = document.getElementById("productCount");
        if(countEl) countEl.textContent = products.length;

    }catch(error){

        console.log("FETCH ERROR");
        console.log(error);
    }
}

fetchProducts();


// ================= ADD PRODUCT =================

productForm.addEventListener(
"submit",
async(e)=>{

    e.preventDefault();

    const formData = new FormData();

    formData.append("name", document.getElementById("name").value);
    formData.append("category", document.getElementById("category").value);
    formData.append("description", document.getElementById("description").value);
    formData.append("price", document.getElementById("price").value);
    formData.append("speed", document.getElementById("speed").value);
    formData.append("range_km", document.getElementById("range_km").value);
    formData.append("battery", document.getElementById("battery").value);
    formData.append("warranty", document.getElementById("warranty").value);
    formData.append("fast_charging_hours", document.getElementById("fast_charging_hours").value);
    formData.append("brake_type", document.getElementById("brake_type").value);

    formData.append("image", document.getElementById("image").files[0]);
    formData.append("image2", document.getElementById("image2").files[0]);
    formData.append("image3", document.getElementById("image3").files[0]);
    formData.append("image4", document.getElementById("image4").files[0]);

   const url = editingProductId
    ? `/api/products/${editingProductId}`
    : "/api/products";

const method = editingProductId
    ? "PUT"
    : "POST";

const response = await fetch(url,{
    method,
    headers:{
        Authorization:"Bearer " + token
    },
    body:formData
});

const data = await response.json();

alert(data.message);

if(data.success){

    editingProductId = null;

    productForm.reset();

    productForm.querySelector("button").innerHTML =
    "<i class='bx bx-plus'></i> Add Product";

    fetchProducts();
}
});


// ================= DELETE PRODUCT =================

async function deleteProduct(id){

    try{

        const response = await fetch(

            `/api/products/${id}`,

            {
                method:"DELETE",
                headers:{
                    Authorization:"Bearer " + token
                }
            }
        );

        const data = await response.json();

        alert(data.message);

        fetchProducts();

    }catch(error){

        console.log(error);
        alert("Delete Failed");
    }
}


let editingProductId = null;

async function editProduct(id){

    const res = await fetch("/api/products", {
    headers: {
        Authorization: "Bearer " + token
    }
});
    const products = await res.json();

    const product = products.find(p => p.id == id);

    editingProductId = id;

    document.getElementById("name").value = product.name;
    document.getElementById("category").value = product.category;
    document.getElementById("description").value = product.description;
    document.getElementById("price").value = product.price;
    document.getElementById("speed").value = product.speed;
    document.getElementById("range_km").value = product.range_km;
    document.getElementById("battery").value = product.battery;
    document.getElementById("warranty").value = product.warranty;
    document.getElementById("fast_charging_hours").value = product.fast_charging_hours;
    document.getElementById("brake_type").value = product.brake_type;

    productForm.querySelector("button").textContent = "Update Product";
}


// ================= ORDERS =================
// NOTE: table row must produce EXACTLY as many <td> as there are <th> in
// admin.html's orders table header, in the same order, or every column
// after the mismatch point will show the wrong value. Header currently has:
// ID, Customer, Total, Payment, UTR, Status, Cancelled By, Tracking,
// Order Date, Estimated Delivery, Confirmed, Shipped, Out For Delivery,
// Delivered, Address, Nearby, District, State, Pincode, Action  (20 columns)

async function loadOrders(){

    const res = await fetch(
        "/api/admin/orders",
        {
            headers:{
                Authorization:"Bearer " + token
            }
        }
    );

    const orders = await res.json();

    const table = document.getElementById("ordersTable");

    table.innerHTML = "";

    orders.forEach(order=>{

        table.innerHTML += `
          <tr>

            <td data-label="ID">${order.id}</td>

            <td data-label="Customer">${order.customer_name}</td>

            <td data-label="Total" class="price-cell">₹${order.total_price}</td>

            <td data-label="Payment">${order.payment_method}</td>

            <td data-label="UTR">
                ${order.payment_method === "QR"
                    ? `
                    <div class="utr-cell">
                        <span>${order.utr_number || "-"}</span>
                        <button class="verify-btn" onclick="verifyQR(${order.id})">Verify</button>
                    </div>
                    `
                    : "-"
                }
            </td>

            <td data-label="Status">
                <span class="status-badge ${statusBadgeClass(order.order_status)}">${order.order_status}</span>
            </td>

            <td data-label="Cancelled By">${order.cancelled_by || "-"}</td>

            <td data-label="Tracking">${order.tracking_id}</td>

            <td data-label="Order Date">${new Date(order.created_at).toLocaleDateString()}</td>

            <td data-label="Estimated Delivery">
                ${order.estimated_delivery
                    ? new Date(order.estimated_delivery).toLocaleDateString()
                    : "-"}
            </td>

            <td data-label="Confirmed">
                ${order.confirmed_at
                    ? new Date(order.confirmed_at).toLocaleString()
                    : "-"}
            </td>

            <td data-label="Shipped">
                ${order.shipped_at
                    ? new Date(order.shipped_at).toLocaleString()
                    : "-"}
            </td>

            <td data-label="Out For Delivery">
                ${order.out_for_delivery_at
                    ? new Date(order.out_for_delivery_at).toLocaleString()
                    : "-"}
            </td>

            <td data-label="Delivered">
                ${order.delivered_at
                    ? new Date(order.delivered_at).toLocaleString()
                    : "-"}
            </td>

            <td data-label="Address">${order.address}</td>

            <td data-label="Nearby">${order.nearby || "-"}</td>

            <td data-label="District">${order.district}</td>

            <td data-label="State">${order.state}</td>

            <td data-label="Pincode">${order.pincode}</td>

            <td data-label="Action">
                <select class="status-select" onchange="updateStatus(${order.id}, this.value)">

                    <option value="Processing" ${order.order_status==="Processing"?"selected":""}>Processing</option>
                    <option value="Confirmed" ${order.order_status==="Confirmed"?"selected":""}>Confirmed</option>
                    <option value="Shipped" ${order.order_status==="Shipped"?"selected":""}>Shipped</option>
                    <option value="Out For Delivery" ${order.order_status==="Out For Delivery"?"selected":""}>Out For Delivery</option>
                    <option value="Delivered" ${order.order_status==="Delivered"?"selected":""}>Delivered</option>
                    <option value="Cancelled" ${order.order_status==="Cancelled"?"selected":""}>Cancelled</option>

                </select>
            </td>

        </tr>
        `;
    });

    const countEl = document.getElementById("orderCount");
    if(countEl) countEl.textContent = orders.length;
}

loadOrders();


async function updateStatus(id, status){

    await fetch(

        `/api/admin/order-status/${id}`,

        {
            method:"PUT",
            headers:{
                "Content-Type":"application/json",
                Authorization:"Bearer " + token
            },
            body:JSON.stringify({ status })
        }
    );

    loadOrders();
}


// ================= CUSTOMERS =================

fetch("/api/admin/users",
    {
        headers:{
            Authorization:"Bearer " + token
        }
    }
)
.then(res => res.json())
.then(users => {

    const tbody = document.getElementById("userBody");

    tbody.innerHTML = "";

    users.forEach(user => {

        tbody.innerHTML += `
        <tr>
            <td data-label="ID">${user.id}</td>
            <td data-label="Name">${user.name || ""}</td>
            <td data-label="Email">${user.email || ""}</td>
            <td data-label="Phone">${user.phone || ""}</td>
            <td data-label="District">${user.district || ""}</td>
            <td data-label="State">${user.state || ""}</td>
            <td data-label="Action">
                <button class="delete-btn" onclick="deleteUser(${user.id})">Delete</button>
            </td>
        </tr>
        `;
    });

    const countEl = document.getElementById("userCount");
    if(countEl) countEl.textContent = users.length;
});


function deleteUser(id){

    if(!confirm("Delete this user?")) return;

    fetch(
        `/api/admin/users/${id}`,
        {
            method:"DELETE",
            headers:{
                Authorization:"Bearer " + token
            }
        }
    )
    .then(res=>res.json())
    .then(data=>{
        alert(data.message);
        location.reload();
    });
}


// ================= SECTION SWITCHING =================

function showSection(sectionId, navEl){

    document.querySelectorAll(".section").forEach(section=>{
        section.style.display = "none";
    });

    document.getElementById(sectionId).style.display = "block";

    document.querySelectorAll(".nav-item").forEach(item=>{
        item.classList.remove("active");
    });

    if(navEl){
        navEl.classList.add("active");
    }

    if(sectionId === "heroStatsSection"){
        loadHeroStats();
    }
    if(sectionId==="dealershipSection"){

    loadDealershipProducts();

    }

    if(sectionId==="inquirySection"){

    loadInquiries();

}

    // menu item click par drawer band ho jaye (sab devices pe)
    document.getElementById("sideDrawer").classList.remove("open");
    document.getElementById("drawerOverlay").classList.remove("active");
}




// ================= REVIEWS =================

async function deleteReview(id){

    if(!confirm("Delete Review?")) return;

    await fetch(
        "/api/admin/reviews/"+id,
        {
            method:"DELETE",
            headers:{
                Authorization:"Bearer " + token
            }
        }
    );

    loadReviews();
}


async function loadReviews(){

    try{

        const response = await fetch(
            "/api/admin/reviews",
            {
                headers:{
                    Authorization:"Bearer " + token
                }
            }
        );

        const reviews = await response.json();

        const table = document.getElementById("reviewTable");

        table.innerHTML = "";

        reviews.forEach(review=>{

            table.innerHTML += `
            <tr>
                <td data-label="ID">${review.id}</td>
                <td data-label="Name">${review.name}</td>
                <td data-label="Email">${review.email}</td>
                <td data-label="Subject">${review.subject}</td>
                <td data-label="Review">${review.message}</td>
                <td data-label="Date">${review.created_at}</td>
                <td data-label="Action">
                    <button class="delete-btn" onclick="deleteReview(${review.id})">Delete</button>
                </td>
            </tr>
            `;
        });

        const countEl = document.getElementById("reviewCount");
        if(countEl) countEl.textContent = reviews.length;

    }catch(error){

        console.log("Review Load Error:", error);
    }
}

loadReviews();


// ================= HERO STATS =================

function loadHeroStats(){

    fetch("/api/hero-stats")
    .then(res=>res.json())
    .then(data=>{

        const table = document.getElementById("heroStatsTable");

        table.innerHTML = "";

        data.forEach(item=>{

            table.innerHTML += `
            <tr>
                <td data-label="Title">${item.title}</td>
                <td data-label="Value">
                    <input type="text" value="${item.value}" id="stat${item.id}">
                </td>
                <td data-label="Action">
                    <button onclick="updateHeroStat(${item.id})">Update</button>
                </td>
            </tr>
            `;
        });
    });
}


function updateHeroStat(id){

    const value = document.getElementById(`stat${id}`).value;

    fetch(`/api/hero-stats/${id}`, {

        method:"PUT",
        headers:{
            "Content-Type":"application/json",
            Authorization:"Bearer " + token
        },
        body:JSON.stringify({ value })

    })
    .then(res=>res.json())
    .then(()=>{
        alert("Updated");
        loadHeroStats();
    });
}

// ================= DEALERSHIP PRODUCTS =================

// LOAD

async function loadDealershipProducts(){

    const res = await fetch(

        "/api/admin/dealership-products",

        {
            headers:{
                Authorization:"Bearer " + token
            }
        }

    );

    const products = await res.json();

    dealershipTable.innerHTML="";

    products.forEach(product=>{

        dealershipTable.innerHTML+=`

        <tr>

            <td>

                <img
                src="${product.image}"
                width="80">

            </td>

            <td>${product.name}</td>

            <td>${product.category}</td>

            <td>${product.motor}</td>

            <td>${product.battery}</td>

            <td>${product.range_km}</td>

            <td>

                <button
                class="delete-btn"

                onclick="deleteDealershipProduct(${product.id})">

                Delete

                </button>

            </td>

        </tr>

        `;

    });

    document.getElementById("dealershipCount").innerText=
    products.length;

}



// ADD

dealershipForm.addEventListener(

"submit",

async(e)=>{

e.preventDefault();

const formData=new FormData();

formData.append(
"name",
document.getElementById("d_name").value
);

formData.append(
"category",
document.getElementById("d_category").value
);

formData.append(
"description",
document.getElementById("d_description").value
);

formData.append(
"motor",
document.getElementById("d_motor").value
);

formData.append(
"battery",
document.getElementById("d_battery").value
);

formData.append(
"range_km",
document.getElementById("d_range").value
);

formData.append(

"image",

document.getElementById("d_image").files[0]

);

const res=await fetch(

"/api/dealership-products",

{

method:"POST",

headers:{

Authorization:"Bearer "+token

},

body:formData

}

);

const data=await res.json();

alert(data.message);

dealershipForm.reset();

loadDealershipProducts();

});



// DELETE

async function deleteDealershipProduct(id){

if(!confirm("Delete Product?")) return;

await fetch(

"/api/dealership-products/"+id,

{

method:"DELETE",

headers:{

Authorization:"Bearer "+token

}

}

);

loadDealershipProducts();

}



// Auto Load

loadDealershipProducts();


async function loadInquiries(){

    const res=await fetch(

        "/api/admin/inquiries",

        {

            headers:{

                Authorization:"Bearer "+token

            }

        }

    );

    const data=await res.json();

    const table=document.getElementById("inquiryTable");

    table.innerHTML="";

    data.forEach(i=>{

        table.innerHTML+=`

        <tr>

            <td>${i.id}</td>

            <td>${i.full_name}</td>

            <td>${i.phone}</td>

            <td>${i.email}</td>

            <td>${i.city}</td>

            <td>${i.interest}</td>

            <td>${i.message}</td>

            <td>${new Date(i.created_at).toLocaleDateString()}</td>

            <td>

                <button

                onclick="deleteInquiry(${i.id})"

                class="delete-btn">

                Delete

                </button>

            </td>

        </tr>

        `;

    });

}


async function deleteInquiry(id){

    if(!confirm("Delete Inquiry?")) return;

    await fetch(

        "/api/admin/inquiries/"+id,

        {

            method:"DELETE",

            headers:{

                Authorization:"Bearer "+token

            }

        }

    );

    loadInquiries();

}