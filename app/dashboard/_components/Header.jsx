"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const Header = () => {
  const path = usePathname();

  useEffect(() => {
    console.log(path);
  }, [path]);

  return (
    <div className="flex p-4 items-center justify-between bg-secondary shadow-md">
      <Link href="/">
        <Image src={"/logo.svg"} width={70} height={100} alt="logo" />
      </Link>

      <ul className="hidden md:flex gap-6">
        <li>
          <Link
            href="/dashboard"
            className={`hover:bg-indigo-300 px-3 py-1 rounded cursor-pointer hover:font-bold transition-all
              ${path === "/dashboard" ? "bg-indigo-300 font-bold" : ""}
            `}
          >
            Dashboard
          </Link>
        </li>

        <li>
          <Link
            href="/dashboard/questions"
            className={`hover:bg-amber-400 px-3 py-1 rounded cursor-pointer hover:font-bold transition-all
              ${path === "/dashboard/questions" ? "bg-amber-400 font-bold" : ""}
            `}
          >
            Questions
          </Link>
        </li>

        <li>
          <Link
            href="/dashboard/upgrade"
            className={`hover:bg-blue-300 px-3 py-1 rounded cursor-pointer hover:font-bold transition-all
              ${path === "/dashboard/upgrade" ? "bg-blue-300 font-bold" : ""}
            `}
          >
            Upgrade
          </Link>
        </li>

        <li>
          <Link
            href="/dashboard/howitworks"
            className={`hover:bg-red-400 px-3 py-1 rounded cursor-pointer hover:font-bold transition-all
              ${path === "/dashboard/howitworks" ? "bg-red-400 font-bold" : ""}
            `}
          >
            How it works
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Header;
