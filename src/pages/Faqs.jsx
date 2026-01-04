import React, { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

import {
    FaQuestionCircle,
    FaPlus,
    FaMinus,
    FaTruck,
    FaPrescriptionBottleAlt,
    FaUserMd,
    FaShieldAlt,
} from "react-icons/fa";

import { Link } from "react-router-dom";

const faqsData = [
    {
        category: "Orders & Delivery",
        icon: <FaTruck />,
        items: [
            {
                q: "How long does delivery take?",
                a: "We deliver medicines within 24–48 hours inside Dhaka and 2–4 working days outside Dhaka.",
            },
            {
                q: "Can I track my order?",
                a: "Yes, you can track your order from your dashboard under the 'My Orders' section.",
            },
        ],
    },
    {
        category: "Medicines & Prescriptions",
        icon: <FaPrescriptionBottleAlt />,
        items: [
            {
                q: "Do I need a prescription to order medicines?",
                a: "Prescription is required for certain medicines. You can upload it during checkout.",
            },
            {
                q: "Are medicines authentic?",
                a: "Yes, all medicines are sourced from licensed pharmacies and verified suppliers.",
            },
        ],
    },
    {
        category: "Medical Support",
        icon: <FaUserMd />,
        items: [
            {
                q: "Can I consult a pharmacist?",
                a: "Absolutely! Our certified pharmacists are available for online consultation.",
            },
            {
                q: "Is medical advice free?",
                a: "Basic consultations are free. Specialized consultations may have a minimal charge.",
            },
        ],
    },
    {
        category: "Privacy & Security",
        icon: <FaShieldAlt />,
        items: [
            {
                q: "Is my personal data secure?",
                a: "We use industry-standard encryption to protect your personal and medical data.",
            },
            {
                q: "Do you share user information?",
                a: "No. Your data is never shared with third parties without your consent.",
            },
        ],
    },
];

const Faqs = () => {
    const [openIndex, setOpenIndex] = useState(null);

    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: true,
        });
    }, []);

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="w-full text-gray-800">

            {/* ================= HERO SECTION ================= */}
            <section className="relative bg-gradient-to-br from-emerald-400 via-emerald-600 to-green-700 text-white py-28 px-6 text-center">
                <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
                    Frequently Asked Questions
                </h1>
                <p className="max-w-3xl mx-auto text-lg md:text-xl opacity-95">
                    Find quick answers about orders, medicines, delivery, prescriptions,
                    privacy, and medical support at MediCare.
                </p>
            </section>

            {/* ================= HIGHLIGHT CAROUSEL ================= */}
            <section className="py-20 px-6 md:px-20 bg-gray-50">
                <Carousel
                    autoPlay
                    infiniteLoop
                    showThumbs={false}
                    showStatus={false}
                    interval={3500}
                >
                    {[
                        {
                            icon: <FaTruck />,
                            title: "Fast & Reliable Delivery",
                            text: "Get medicines delivered safely to your doorstep.",
                        },
                        {
                            icon: <FaPrescriptionBottleAlt />,
                            title: "Verified Medicines",
                            text: "100% authentic medicines from licensed pharmacies.",
                        },
                        {
                            icon: <FaUserMd />,
                            title: "Expert Medical Support",
                            text: "Consult certified pharmacists anytime.",
                        },
                    ].map((item, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-3xl shadow-2xl p-12 text-center"
                        >
                            <div className="text-5xl text-emerald-600 mb-6 flex justify-center">
                                {item.icon}
                            </div>
                            <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                            <p className="text-gray-600 text-lg">{item.text}</p>
                        </div>
                    ))}
                </Carousel>
            </section>

            {/* ================= FAQ ACCORDION ================= */}
            <section className="py-24 px-6 md:px-20">
                <div className="max-w-5xl mx-auto">
                    {faqsData.map((section, sectionIndex) => (
                        <div
                            key={sectionIndex}
                            data-aos="fade-up"
                            className="mb-16"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="text-3xl text-emerald-600">
                                    {section.icon}
                                </div>
                                <h2 className="text-3xl font-bold">
                                    {section.category}
                                </h2>
                            </div>

                            <div className="space-y-6">
                                {section.items.map((faq, faqIndex) => {
                                    const index = `${sectionIndex}-${faqIndex}`;
                                    const isOpen = openIndex === index;

                                    return (
                                        <div
                                            key={index}
                                            className="bg-white rounded-2xl shadow-lg overflow-hidden"
                                        >
                                            <button
                                                onClick={() => toggleFAQ(index)}
                                                className="w-full flex justify-between items-center p-6 text-left"
                                            >
                                                <span className="text-lg font-semibold">
                                                    {faq.q}
                                                </span>
                                                <span className="text-emerald-600 text-xl">
                                                    {isOpen ? <FaMinus /> : <FaPlus />}
                                                </span>
                                            </button>

                                            {isOpen && (
                                                <div className="px-6 pb-6 text-gray-600 text-base">
                                                    {faq.a}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ================= SUPPORT CTA ================= */}
            <section className="bg-gradient-to-r from-emerald-600 to-green-600 text-white py-20 px-6 text-center">
                <h2 className="text-4xl font-extrabold mb-6">
                    Still Have Questions?
                </h2>
                <p className="max-w-2xl mx-auto text-lg mb-8">
                    Our support team and certified pharmacists are always ready to help you.
                </p>
                <Link
                    to="/contact"
                    className="inline-block bg-white text-emerald-600 px-10 py-4 rounded-full font-semibold hover:scale-105 transition"
                >
                    Contact Support
                </Link>
            </section>
        </div>
    );
};

export default Faqs;
