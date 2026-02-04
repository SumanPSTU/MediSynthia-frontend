// AboutUsAdvanced.jsx
import React, { useEffect } from "react";
import AOS from "aos";
import { Link } from "react-router-dom";
import "aos/dist/aos.css";
import { FaHeartbeat, FaUserMd, FaTruck, FaShieldAlt, FaFacebookF, FaTwitter, FaLinkedinIn, FaAward, FaCertificate } from "react-icons/fa";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

const AboutUs = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  const teamMembers = [
    { name: "Dr. Ahsunul Ahmed", role: "Chief Pharmacist", img: "/team1.jpg", social: { fb: "#", tw: "#", li: "#" } },
    { name: "Sara Khan", role: "Operations Manager", img: "/team2.jpg", social: { fb: "#", tw: "#", li: "#" } },
    { name: "Rafiq Islam", role: "Logistics Head", img: "/team3.jpg", social: { fb: "#", tw: "#", li: "#" } },
    { name: "Nadia Rahman", role: "Customer Support Lead", img: "/team4.jpg", social: { fb: "#", tw: "#", li: "#" } },
  ];

  const features = [
    { icon: <FaHeartbeat />, title: "Quality Medicines", desc: "Authentic medicines delivered safely to your doorstep." },
    { icon: <FaUserMd />, title: "Expert Guidance", desc: "Certified pharmacists available for online consultation." },
    { icon: <FaTruck />, title: "Fast Delivery", desc: "Reliable delivery across Bangladesh with tracking support." },
    { icon: <FaShieldAlt />, title: "Secure Payments", desc: "Encrypted, safe, and multiple payment options." },
  ];

  const statistics = [
    { label: "Medicines Delivered", value: 12000 },
    { label: "Happy Customers", value: 8000 },
    { label: "Certified Pharmacists", value: 25 },
    { label: "Cities Covered", value: 50 },
  ];

  const testimonials = [
    { name: "Farhana Akter", feedback: "MediSynthia is super reliable! Fast delivery and genuine medicines." },
    { name: "Rashed Khan", feedback: "Great customer service and excellent guidance from pharmacists." },
    { name: "Sabbir Ahmed", feedback: "User-friendly platform, and I trust the quality 100%." },
  ];

  const awards = [
    { title: "Best Online Pharmacy 2025", icon: <FaAward /> },
    { title: "Certified Safe Delivery", icon: <FaCertificate /> },
  ];

  return (
    <div className="w-full text-gray-800">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-400 to-[rgb(7,150,105)] text-white py-32 px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6" data-aos="fade-down">Welcome to MediSynthia</h1>
        <p className="max-w-3xl mx-auto text-lg md:text-xl mb-8" data-aos="fade-up">
          Your trusted online pharmacy in Bangladesh. Authentic medicines, expert guidance, and fast delivery at your fingertips.
        </p>
        <Link to="/">
        <button className="bg-white text-[rgb(7,150,105)] font-semibold px-8 py-3 rounded-full hover:scale-105 transition-transform" data-aos="zoom-in">
          Explore Our Service
        </button>
        </Link>
      </section>

      {/* Statistics Section */}
      <section className="py-20 px-6 md:px-20 bg-gray-50">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {statistics.map((stat, idx) => (
            <div key={idx} className="bg-white shadow-lg rounded-lg p-6 hover:shadow-2xl transition-shadow" data-aos="fade-up" data-aos-delay={idx*100}>
              <h3 className="text-4xl font-bold text-[rgb(7,150,105)] mb-2">{stat.value.toLocaleString()}+</h3>
              <p className="text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 md:px-20">
        <h2 className="text-3xl font-bold text-center mb-12" data-aos="fade-up">Why Choose MediSynthia?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
  <div
    key={idx}
    className="bg-white shadow-lg rounded-lg p-6 text-center hover:scale-105 transition-transform duration-300"
    data-aos="flip-left"
    data-aos-delay={idx * 150}
  >
    <div className="flex justify-center items-center mb-4">
      <div className="text-4xl text-[rgb(7,150,105)]">
        {feature.icon}
      </div>
    </div>

    <h3 className="font-semibold text-xl mb-2">{feature.title}</h3>
    <p className="text-gray-600">{feature.desc}</p>
  </div>
))}

        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-6 md:px-20 bg-gray-100">
        <h2 className="text-3xl font-bold text-center mb-12" data-aos="fade-up">Meet Our Experts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {teamMembers.map((member, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-lg overflow-hidden hover:scale-105 transition-transform duration-300" data-aos="fade-up" data-aos-delay={idx*100}>
              <div className="relative group">
                <img src={member.img} alt={member.name} className="w-full h-56 object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex gap-4 text-white text-xl">
                    <a href={member.social.fb}><FaFacebookF /></a>
                    <a href={member.social.tw}><FaTwitter /></a>
                    <a href={member.social.li}><FaLinkedinIn /></a>
                  </div>
                </div>
              </div>
              <div className="p-4 text-center">
                <h3 className="text-xl font-semibold">{member.name}</h3>
                <p className="text-gray-500">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 px-6 md:px-20 text-center">
        <h2 className="text-3xl font-bold mb-6" data-aos="fade-up">Our Mission & Vision</h2>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <div data-aos="fade-right">
            <h3 className="text-2xl font-semibold mb-2">Mission</h3>
            <p className="text-gray-700">Make healthcare accessible, safe, and convenient for everyone with trusted medicines and expert guidance.</p>
          </div>
          <div data-aos="fade-left">
            <h3 className="text-2xl font-semibold mb-2">Vision</h3>
            <p className="text-gray-700">To be the most reliable online pharmacy in Bangladesh, empowering people to live healthier lives.</p>
          </div>
        </div>
      </section>

      {/* Awards Section */}
      <section className="py-20 px-6 md:px-20 bg-gray-50">
        <h2 className="text-3xl font-bold text-center mb-12" data-aos="fade-up">Our Achievements</h2>
        <div className="flex justify-center gap-12">
         {awards.map((award, idx) => (
  <div
    key={idx}
    className="bg-white shadow-lg rounded-lg p-8 text-center hover:shadow-2xl transition-shadow"
    data-aos="zoom-in"
    data-aos-delay={idx * 100}
  >
    <div className="flex justify-center items-center mb-4">
      <div className="text-5xl text-[rgb(7,150,105)]">
        {award.icon}
      </div>
    </div>

    <h3 className="text-xl font-semibold">{award.title}</h3>
  </div>
))}

        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 md:px-20">
        <h2 className="text-3xl font-bold text-center mb-12" data-aos="fade-up">What Our Customers Say</h2>
        <Carousel
          autoPlay
          infiniteLoop
          showThumbs={false}
          showStatus={false}
          interval={5000}
        >
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-white p-8 shadow-lg rounded-lg max-w-2xl mx-auto" data-aos="fade-up">
              <p className="text-gray-700 mb-4 text-lg italic">"{t.feedback}"</p>
              <h4 className="font-semibold text-[rgb(7,150,105)]">{t.name}</h4>
            </div>
          ))}
        </Carousel>
      </section>

      {/* CTA Footer */}
      <section className="bg-gradient-to-r from-green-400 to-[rgb(7,150,105)] text-white py-24 px-6 text-center" data-aos="fade-up">
        <h2 className="text-4xl font-bold mb-6">Ready to Experience MediSynthia?</h2>
        <p className="max-w-2xl mx-auto mb-8 text-lg">
          Join thousands of happy customers and get your medicines delivered safely to your doorstep.
        </p>
        <Link to="/">
        <button className="bg-white text-[rgb(7,150,105)] font-semibold px-8 py-3 rounded-full hover:scale-105 transition-transform">
          Shop Now
        </button>
        </Link>
      </section>
    </div>
  );
};

export default AboutUs;
