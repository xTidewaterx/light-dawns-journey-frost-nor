"use client";

import React, { useState } from "react";
import { auth } from "../../firebase/firebaseConfig";

export default function CreateShipmentButton(shippingData) {
  const [shipmentDataStatus, setShipmentDataStatus] = useState(0);

  async function createShipment() {

    console.log("Creating shipment with data:", shippingData);


    const {name, street, streetNumber, city, postcode, country} = shippingData.shipmentData;

    const senderName = name;

    try {
      // ✅ Always use valid sandbox product and service
      const shipmentData = {
        test_mode: true,
        own_agreement: false,
        product_id: "GLSDK_HD", // ✅ Sandbox-safe product (GLS DK Home Delivery)
        product_code: "GLSDK_HD", // ✅ Include product_code explicitly
        service_codes: ["EMAIL_NT"], // ✅ Required notification service
        reference: "Sandbox Test Order",

        parties: [
          {
            type: "sender",
            name: senderName,
            address1: "Sender Street 1",
            postal_code: "2100",
            city: "København",
            country_code: "DK",
            email: "sender@example.com",
            phone: "+4511122233",
          },
          {
            type: "receiver",
            name: "Receiver Name",
            address1: "Receiver Street 2",
            postal_code: "8000",
            city: "Aarhus",
            country_code: "DK",
            email: "receiver@example.com",
            phone: "+4511223344",
          },
        ],

        parcels: [
          {
            weight: 1.2,
            length: 30,
            width: 20,
            height: 10,
          },
        ],
      };

      // ✅ Send to backend
      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : null;

      if (!idToken) {
        console.error("❌ No authenticated user token found for shipment request.");
        setShipmentDataStatus(2);
        return;
      }

      const response = await fetch("/api/shipment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(shipmentData),
      });

      let data;
      try {
        data = await response.json();
      } catch (err) {
        const text = await response.text();
        console.error("❌ Shipmondo returned non-JSON response:", text);
        setShipmentDataStatus(2);
        return;
      }

      if (!response.ok) {
        console.error("❌ Shipmondo API error:", data);
        setShipmentDataStatus(2);
      } else {
        console.log("✅ Shipment created successfully:", data);
        setShipmentDataStatus(1);
      }
    } catch (error) {
      console.error("💥 Error creating shipment:", error);
      setShipmentDataStatus(2);
    }
  }

  return (
    <div>
      <button
        onClick={createShipment}
        style={{
          padding: "8px 16px",
          backgroundColor: "#2563eb",
          color: "white",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
        }}
      >
        Create Shipment (Sandbox)
      </button>

      <p style={{ marginTop: "8px" }}>
        Shipment creation status:{" "}
        {shipmentDataStatus === 0
          ? "Not started"
          : shipmentDataStatus === 1
          ? "✅ Success"
          : "❌ Failed"}
      </p>
    </div>
  );
}