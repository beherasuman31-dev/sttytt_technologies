const token = localStorage.getItem("token");

const container =
document.getElementById("ordersContainer");

fetch("http://localhost:5000/api/orders",{

    method:"GET",

    headers:{
        Authorization: token
    }

})

.then(res=>res.json())

.then(orders=>{

    container.innerHTML = "";

    if(!orders || orders.length===0){

        container.innerHTML = `
        <div class="empty-orders">
            <h2>No Orders Found</h2>
            <p>You haven't placed any order yet.</p>
        </div>
        `;

        return;
    }

    orders.forEach(order=>{

        let statusIndex = 1;

        if(order.order_status==="Confirmed")
            statusIndex = 2;

        if(order.order_status==="Shipped")
            statusIndex = 3;

        if(order.order_status==="Out For Delivery")
            statusIndex = 4;

        if(order.order_status==="Delivered")
            statusIndex = 5;
        if(order.order_status==="Cancelled")
          statusIndex = 0;

        let productsHTML = "";

        try{

            const products =
            JSON.parse(order.products);

            products.forEach(item=>{

                productsHTML += `

                <div class="ordered-product">

                    <h4>
                        ${item.product_name}
                    </h4>

                    <p>
                        Qty : ${item.quantity}
                    </p>

                    <p>
                        ₹${item.product_price}
                    </p>

                </div>

                `;
            });

        }catch(error){

            productsHTML =
            "<p>Product details unavailable</p>";
        }

       let paymentStatus;

if (order.payment_method === "COD") {
    paymentStatus =
        order.order_status === "Delivered"
            ? "Paid"
            : "Pending";
} else {
    paymentStatus = "Paid";
}

        container.innerHTML += `

        <div class="order-card">

            <h2>Order #${order.id}</h2>

            <p>
                <strong>Total Price:</strong>
                ₹${order.total_price}
            </p>

            <p>
                <strong>Payment Status:</strong>
                <span class="status">
                    ${paymentStatus}
                </span>
            </p>

            <p>
                <strong>Tracking ID:</strong>
                ${order.tracking_id}
            </p>

            <p>
                <strong>Payment Method:</strong>
                ${order.payment_method}
            </p>

            <p>
                <strong>Customer:</strong>
                ${order.customer_name}
            </p>

            <p>
                <strong>Phone:</strong>
                ${order.phone}
            </p>

            <p>
                <strong>Address:</strong>

                ${order.address},
                ${order.city},
                ${order.state}
                -
                ${order.pincode}
            </p>

            <p>
                <strong>Order Date:</strong>

                ${new Date(order.created_at)
                .toLocaleDateString()}
            </p>

            <h3>Ordered Products</h3>

            ${productsHTML}

            <div class="timeline">

                <div class="step ${statusIndex>=1?'active':''}">
                    <div class="circle"></div>
                    <div class="label">
                        Order Placed
                    </div>
                </div>

                <div class="step ${statusIndex>=2?'active':''}">
                    <div class="circle"></div>
                    <div class="label">
                        Confirmed
                    </div>
                </div>

                <div class="step ${statusIndex>=3?'active':''}">
                    <div class="circle"></div>
                    <div class="label">
                        Shipped
                    </div>
                </div>

                <div class="step ${statusIndex>=4?'active':''}">
                    <div class="circle"></div>
                    <div class="label">
                        Out For Delivery
                    </div>
                </div>

                <div class="step ${statusIndex>=5?'active':''}">
                    <div class="circle"></div>
                    <div class="label">
                        Delivered
                    </div>
                </div>

            </div>
               ${order.order_status === "Cancelled" ? `

           <div class="cancelled-order">
              ❌ Order Cancelled
              </div>

               ` : ""}


            ${["Processing","Confirmed","Shipped"].includes(order.order_status) ? `

            <div class="order-actions">

           <button onclick="cancelOrder(${order.id})" class="cancel-btn">
           ❌ Cancel Order
           </button>

           </div>

               ` : ""}

             ${order.order_status === "Delivered" ? `

            <div class="order-actions">

              <button onclick="downloadInvoice(${order.id})">
                📄 Download Invoice
    </button>

</div>

 ` : ""}

        </div>

        `;
    });

})

.catch(error=>{

    console.log(error);

    container.innerHTML = `

    <div class="empty-orders">

        Failed To Load Orders

    </div>

    `;
});



async function downloadInvoice(orderId){

    try{

        const res = await fetch(
            `http://localhost:5000/api/invoice/${orderId}`,
            {
                headers:{
                    Authorization: token
                }
            }
        );

        if(!res.ok){
            alert("Invoice download failed");
            return;
        }

        const blob = await res.blob();

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;
        a.download = `Invoice-${orderId}.pdf`;

        document.body.appendChild(a);

        a.click();

        a.remove();

        window.URL.revokeObjectURL(url);

    }catch(error){

        console.log(error);

        alert("Invoice download failed");

    }

}


async function cancelOrder(orderId){

    if(!confirm("Are you sure you want to cancel this order?")){
        return;
    }

    try{

        const res = await fetch(
            `http://localhost:5000/api/orders/${orderId}/cancel`,
            {
                method:"PUT",
                headers:{
                    Authorization: token
                }
            }
        );

        const data = await res.json();

        alert(data.message);

        location.reload();

    }catch(error){

        alert("Failed to cancel order");

    }

}