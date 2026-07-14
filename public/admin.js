

const token = localStorage.getItem("token");
const productForm = document.getElementById("productForm");
const productTableBody = document.getElementById("productTableBody");

console.log(productForm);
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

                <td>
                    <img src="${product.image}"
                    width="80">
                </td>

                <td>${product.name}</td>

                <td>₹${product.price}</td>

                <td>${product.category}</td>

                <td>

                    <button
                    class="delete-btn"
                    onclick="deleteProduct(${product.id})">

                        Delete

                    </button>

                </td>

            </tr>
            `;
        });

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

    console.log("FORM SUBMITTED");

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

const response = await fetch(
    "/api/products",
    {
        method: "POST",
        headers:{
        Authorization:"Bearer " + token
    },
        body: formData
    }
);


const data = await response.json();

console.log(data);

alert(data.message);

if(data.success){
    productForm.reset();
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

        const data =
        await response.json();

        alert(data.message);

        fetchProducts();

    }catch(error){

        console.log(error);

        alert("Delete Failed");
    }
}


async function loadOrders(){

    const res =
    await fetch(

    "/api/admin/orders", {
        headers:{
            Authorization:"Bearer " + token
        }
    }
    );

    const orders =
    await res.json();

    const table =
    document.getElementById(
    "ordersTable"
    );

    table.innerHTML="";

    orders.forEach(order=>{

        table.innerHTML += `


          <tr>

<td>${order.id}</td>

<td>${order.customer_name}</td>

<td>₹${order.total_price}</td>

<td>${order.payment_method}</td>

<td>
${order.payment_method === "QR"
? `
<div>${order.utr_number || "-"}</div>
<button onclick="verifyQR(${order.id})">
Verify
</button>
`
: "-"
}
</td>

<td>${order.order_status}</td>

<td>${order.cancelled_by || "-"}</td>

<td>${order.tracking_id}</td>

<td>${new Date(order.created_at).toLocaleDateString()}</td>

<td>
${order.estimated_delivery
? new Date(order.estimated_delivery).toLocaleDateString()
: "-"}
</td>

<td>
${order.confirmed_at
? new Date(order.confirmed_at).toLocaleString()
: "-"}
</td>

<td>
${order.shipped_at
? new Date(order.shipped_at).toLocaleString()
: "-"}
</td>

<td>
${order.out_for_delivery_at
? new Date(order.out_for_delivery_at).toLocaleString()
: "-"}
</td>

<td>
${order.delivered_at
? new Date(order.delivered_at).toLocaleString()
: "-"}
</td>

<td>${order.address}</td>

<td>${order.nearby}</td>

<td>${order.district}</td>

<td>${order.state}</td>

<td>${order.pincode}</td>

<td>
    <!-- Status Select -->
</td>


            <td>

    <select
    onchange="updateStatus(${order.id}, this.value)">

        <option value="Processing"
            ${order.order_status==="Processing"?"selected":""}>
            Processing
        </option>

        <option value="Confirmed"
            ${order.order_status==="Confirmed"?"selected":""}>
            Confirmed
        </option>


        <option value="Shipped"
            ${order.order_status==="Shipped"?"selected":""}>
            Shipped
        </option>

        <option value="Out For Delivery"
            ${order.order_status==="Out For Delivery"?"selected":""}>
            Out For Delivery
        </option>

        <option value="Delivered"
            ${order.order_status==="Delivered"?"selected":""}>
            Delivered
        </option>

        <option value="Cancelled"
            ${order.order_status==="Cancelled"?"selected":""}>
            Cancelled
        </option>

    </select>

</td>
        

        </tr>

        `;
    });
}

loadOrders();



async function updateStatus(

    id,
    status

){

    await fetch(

    `/api/admin/order-status/${id}`,

    {

        method:"PUT",

        headers:{

            "Content-Type":"application/json",
             Authorization:"Bearer " + token
        },

        body:JSON.stringify({

            status
        })
    });

    loadOrders();
}


fetch("/api/admin/users",
    {
    headers:{
        Authorization:"Bearer " + token
    }
}
)

.then(res => res.json())

.then(users => {

    const tbody =
    document.getElementById("userBody");

    tbody.innerHTML = "";

    users.forEach(user => {

        tbody.innerHTML += `

        <tr>

            <td>${user.id}</td>

            <td>${user.name || ""}</td>

            <td>${user.email || ""}</td>

            <td>${user.phone || ""}</td>

            <td>${user.district || ""}</td>

            <td>${user.state || ""}</td>

            <td>

                <button
                onclick="deleteUser(${user.id})">

                Delete

                </button>

            </td>

        </tr>

        `;
    });
});


function deleteUser(id){

    if(!confirm(
        "Delete this user?"
    )) return;

    fetch(

    `/api/admin/users/${id}`,

    {
        method:"DELETE",
         headers:{
            Authorization:"Bearer " + token
        }
    })

    .then(res=>res.json())

    .then(data=>{

        alert(data.message);

        location.reload();
    });
}


function showSection(sectionId){

    document
    .querySelectorAll(".section")
    .forEach(section=>{

        section.style.display = "none";
    });

    document
    .getElementById(sectionId)
    .style.display = "block";
    if(sectionId==="heroStatsSection"){

        loadHeroStats();

    }
}




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
            "/api/admin/reviews", {
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
                <td>${review.id}</td>
                <td>${review.name}</td>
                <td>${review.email}</td>
                <td>${review.subject}</td>
                <td>${review.message}</td>
                <td>${review.created_at}</td>
                <td>
                    <button onclick="deleteReview(${review.id})">
                        Delete
                    </button>
                </td>
            </tr>
            `;
        });

    }catch(error){

        console.log("Review Load Error:", error);

    }
}


loadReviews();


// loadhero
function loadHeroStats(){

fetch("/api/hero-stats")

.then(res=>res.json())

.then(data=>{

const table=document.getElementById("heroStatsTable");

table.innerHTML="";

data.forEach(item=>{

table.innerHTML+=`

<tr>

<td>${item.title}</td>

<td>

<input
type="text"
value="${item.value}"
id="stat${item.id}">

</td>

<td>

<button onclick="updateHeroStat(${item.id})">

Update

</button>

</td>

</tr>

`;

});

});

}



// Update
function updateHeroStat(id){

const value=document.getElementById(`stat${id}`).value;

fetch(`/api/hero-stats/${id}`, {

method:"PUT",

headers:{
"Content-Type":"application/json",
Authorization:"Bearer " + token

},

body:JSON.stringify({

value

})

})

.then(res=>res.json())

.then(()=>{

alert("Updated");

loadHeroStats();

});

}