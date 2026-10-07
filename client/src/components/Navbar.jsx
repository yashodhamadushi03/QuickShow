import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Search, Menu, X, TicketPlus } from "lucide-react";

import {
  useClerk,
  UserButton,
  useUser,
} from "@clerk/clerk-react";



const Navbar = () => {

  const [isOpen, setIsOpen] = useState(false);

  const { user } = useUser();

  const { openSignIn } = useClerk();

  const navigate = useNavigate ();

  return (

    <div className="fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 py-5 bg-black text-white">

      {/* LOGO */}

      <Link to="/">
        <h1 className="text-3xl font-bold text-red-500">
          QuickShow
        </h1>
      </Link>

      {/* MENU */}

      <div className={`flex gap-8 items-center
      max-md:absolute max-md:top-0 max-md:left-0
      max-md:flex-col max-md:justify-center
      max-md:bg-black max-md:w-full max-md:h-screen
      transition-all duration-300
      ${isOpen ? "max-md:flex" : "max-md:hidden md:flex"}`}>

        <X
          className="md:hidden absolute top-6 right-6 cursor-pointer"
          onClick={() => setIsOpen(false)}
        />

        <Link to="/">Home</Link>

        <Link to="/movies">Movies</Link>

        <Link to="/favourite">Favourites</Link>

        <Link to="/theaters">Theaters</Link>

        <Link to="/releases">Releases</Link>

      </div>

      {/* RIGHT SIDE */}

      <div className="flex items-center gap-5">

        <Search className="cursor-pointer" />

        {
          !user ? (

            <button
              onClick={() => openSignIn()} className="bg-red-500 px-5 py-2 rounded-full"
            >
              Login
            </button>

          ) : (

            <UserButton>
              {/* Navigate to My Bookings page on click */}
              <UserButton.MenuItems>
                <UserButton.Action
                  label="My Bookings"
                  labelIcon={<TicketPlus width={15} />}
                  onClick={() => navigate('/my-bookings')}     
                />
              </UserButton.MenuItems>
            </UserButton>

          )
        }

        <Menu
          className="md:hidden cursor-pointer"
          onClick={() => setIsOpen(true)}
        />

      </div>

    </div>
  );
};

export default Navbar;   