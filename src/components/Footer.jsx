import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-emerald-700 to-emerald-500 text-white pt-12 pb-6 mt-16">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-5 gap-10">
        {/* Column 1: Logo + About */}
        <div>
          <h1 className="text-2xl font-bold mb-3">MediCare</h1>
          <p className="text-sm text-gray-100">
            Your trusted online pharmacy delivering health & wellness products
            right at your doorstep.
          </p>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Quick Links</h2>
          <ul className="space-y-2 text-gray-100">
            <li> <Link to="/" className="hover:underline" > Home </Link> </li>
            <li> <Link to="/aboutUs" className="hover:underline"  > About Us </Link> </li>
            <li> <Link to="/contact" className="hover:underline" > Contact </Link> </li>
            <li> <Link to="/" className="hover:underline" > Shop </Link> </li>
            <li> <Link to="/faqs" className="hover:underline" > FAQs </Link> </li>
          </ul>
        </div>

        {/* Column 3: Categories */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Top Categories</h2>
          <ul className="space-y-2 text-gray-100">
            <li><a href="#" className="hover:underline">Pain Relief</a></li>
            <li><a href="#" className="hover:underline">Vitamins & Supplements</a></li>
            <li><a href="#" className="hover:underline">Skin Care</a></li>
            <li><a href="#" className="hover:underline">Diabetes Care</a></li>
            <li><a href="#" className="hover:underline">Baby & Child</a></li>
          </ul>
        </div>

        {/* Column 4: Contact */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Contact Us</h2>
          <ul className="space-y-3 text-gray-100">
            <li className="flex items-center gap-2">
              <MapPin className="w-5 h-5" /> Dhaka, Bangladesh
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-5 h-5" /> +880 1234 567 890
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-5 h-5" /> support@medicare.com
            </li>
          </ul>
        </div>

        {/* Column 5: Shop Description */}
        <div>
          <h2 className="text-lg font-semibold mb-3">About Our Shop</h2>
          <p className="text-sm text-gray-100 leading-relaxed">
            MediCare is more than a pharmacy – it’s your health partner.
            We provide genuine medicines, wellness essentials, and baby care products
            with fast delivery and affordable pricing.
            Your well-being is our priority.
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-emerald-300 my-6"></div>

      {/* Bottom Section */}
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm">
        {/* Social Icons */}
        <div className="flex space-x-5 mb-4 md:mb-0">
          <a href="#" className="hover:text-gray-300"><Facebook className="w-5 h-5" /></a>
          <a href="#" className="hover:text-gray-300"><Twitter className="w-5 h-5" /></a>
          <a href="#" className="hover:text-gray-300"><Instagram className="w-5 h-5" /></a>
          <a href="#" className="hover:text-gray-300"><Linkedin className="w-5 h-5" /></a>
        </div>

        {/* Copyright */}
        <p className="text-gray-200">
          © {new Date().getFullYear()} MediCare. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
