"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CircleCheck,
  ClipboardCheck,
  Clock3,
  IndianRupee,
  Layers3,
  Radio,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicFooter } from "./public-footer";
import { PublicHeader } from "./public-header";

const features = [
  {
    icon: ReceiptText,
    title: "Expense capture",
    text: "Keep receipts, categories, amounts, and dates organized in one tidy workspace.",
  },
  {
    icon: Layers3,
    title: "Clear review flow",
    text: "Move work through employee, manager, finance, and admin views without clutter.",
  },
  {
    icon: ShieldCheck,
    title: "Focused access",
    text: "Each role sees the screens and actions that matter for their day.",
  },
  {
    icon: ClipboardCheck,
    title: "Complete context",
    text: "Dashboards and lists make the current state easy to scan at a glance.",
  },
];

const heroClaims = [
  {
    title: "Travel report",
    status: "MANAGER REVIEW",
    amount: "INR 12,400",
    color: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    title: "Client dinner",
    status: "SENIOR REVIEW",
    amount: "INR 4,850",
    color: "border-sky-200 bg-sky-50 text-sky-700",
  },
  {
    title: "Fuel allowance",
    status: "APPROVED",
    amount: "INR 2,100",
    color: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
];

const heroMetrics = [
  { icon: TrendingUp, value: "82%", label: "On-time" },
  { icon: Clock3, value: "4.8h", label: "Avg. cycle" },
  { icon: IndianRupee, value: "1.9L", label: "Approved" },
];

const pulseDots = [
  "left-[10%] top-[18%]",
  "left-[22%] top-[72%]",
  "left-[48%] top-[14%]",
  "left-[72%] top-[78%]",
  "left-[86%] top-[24%]",
];

const heroTitle = "ExpenseFlow".split("");
const heroDescription = [
  "A polished team console for expenses, people, status, and reporting,",
  "designed to feel fast from the first click.",
];

export function PublicPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#fbfdff_0%,#eef6ff_42%,#f7f0ff_100%)]">
      <PublicHeader />
      <main>
        <section className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            aria-hidden
            className="absolute inset-x-4 top-10 z-0 h-[72%] rounded-[2rem] border border-white/70 bg-[linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:44px_44px] opacity-70"
            animate={{ backgroundPosition: ["0px 0px", "44px 44px"] }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          />
          {pulseDots.map((position, index) => (
            <motion.span
              key={position}
              aria-hidden
              className={`absolute z-0 hidden size-2 rounded-full bg-cyan-600/70 shadow-[0_0_0_6px_rgba(8,145,178,0.12)] lg:block ${position}`}
              animate={{ opacity: [0.25, 1, 0.25], scale: [1, 1.35, 1] }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                delay: index * 0.34,
                ease: "easeInOut",
              }}
            />
          ))}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="relative z-10"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-sm font-medium shadow-sm">
              <Sparkles className="size-4 text-cyan-700" />
              <span className="bg-gradient-to-r from-slate-950 via-indigo-700 to-cyan-600 bg-clip-text text-transparent">
                Expense workspace with momentum
              </span>
            </div>
            <motion.h1
              className="max-w-4xl text-5xl font-bold tracking-normal sm:text-6xl lg:text-7xl"
              aria-label="ExpenseFlow"
            >
              {heroTitle.map((letter, index) => (
                <motion.span
                  key={`${letter}-${index}`}
                  aria-hidden
                  className="inline-block bg-gradient-to-r from-slate-950 via-indigo-700 to-cyan-600 bg-[length:220%_100%] bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: 34, rotateX: -82 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    rotateX: 0,
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    opacity: { duration: 0.35, delay: 0.18 + index * 0.045 },
                    y: { duration: 0.42, delay: 0.18 + index * 0.045 },
                    rotateX: {
                      duration: 0.42,
                      delay: 0.18 + index * 0.045,
                    },
                    backgroundPosition: {
                      duration: 5.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </motion.h1>
            <motion.div
              className="mt-5 max-w-2xl overflow-hidden text-lg font-medium leading-8 text-slate-700"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.18,
                    delayChildren: 0.72,
                  },
                },
              }}
            >
              {heroDescription.map((line) => (
                <motion.p
                  key={line}
                  className="bg-gradient-to-r from-slate-700 via-indigo-700 to-cyan-700 bg-[length:220%_100%] bg-clip-text text-transparent"
                  variants={{
                    hidden: { opacity: 0, y: 18 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%"] }}
                  transition={{
                    opacity: { duration: 0.4 },
                    y: { duration: 0.4 },
                    backgroundPosition: {
                      duration: 4,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    },
                  }}
                >
                  {line}
                </motion.p>
              ))}
            </motion.div>
            <motion.div
              className="mt-8 flex flex-col gap-3 sm:flex-row"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: 0.18 }}
            >
              <Button
                asChild
                size="lg"
                className="shadow-lg shadow-cyan-900/15 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Link href="/login">
                  Open workspace
                  <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-white/80 transition hover:-translate-y-0.5 hover:bg-white"
              >
                <Link href="/signup">Create account</Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className="relative z-10 grid gap-4"
          >
            <motion.div
              aria-hidden
              className="absolute -left-5 top-8 hidden size-20 rounded-2xl border border-white/80 bg-white/80 shadow-xl backdrop-blur md:block"
              animate={{ rotate: [-3, 4, -3], y: [0, -10, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex h-full items-center justify-center">
                <BarChart3 className="size-8 text-cyan-700" />
              </div>
            </motion.div>
            <motion.div
              aria-hidden
              className="absolute -right-4 bottom-28 hidden rounded-lg border border-emerald-200 bg-white/90 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-xl backdrop-blur md:flex md:items-center md:gap-2"
              animate={{ x: [0, 8, 0], y: [0, -8, 0] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <CircleCheck className="size-4" />
              Live status synced
            </motion.div>
            <Card className="overflow-hidden border-white/70 bg-white/90 shadow-2xl shadow-indigo-950/10 backdrop-blur">
              <CardContent className="p-0">
                <div className="relative overflow-hidden border-b bg-gradient-to-r from-slate-950 via-indigo-900 to-cyan-700 p-5 text-white">
                  <motion.div
                    aria-hidden
                    className="absolute inset-y-0 w-24 bg-white/15 blur-xl"
                    animate={{ x: ["-140%", "560%"] }}
                    transition={{
                      duration: 3.4,
                      repeat: Infinity,
                      repeatDelay: 1.2,
                      ease: "easeInOut",
                    }}
                  />
                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-cyan-100">
                        Today&apos;s workspace
                      </p>
                      <p className="mt-2 text-3xl font-semibold">18 items</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-cyan-50">
                      <Radio className="size-3.5" />
                      Real-time
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 p-5">
                  {heroClaims.map((claim, index) => (
                    <motion.div
                      key={claim.title}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ x: 4, scale: 1.01 }}
                      transition={{ duration: 0.28, delay: 0.24 + index * 0.08 }}
                      className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 shadow-sm"
                    >
                      <div>
                        <p className="bg-gradient-to-r from-slate-950 to-indigo-700 bg-clip-text font-medium text-transparent">
                          {claim.title}
                        </p>
                        <p
                          className={`mt-2 w-fit rounded-md border px-2 py-1 text-xs font-semibold ${claim.color}`}
                        >
                          {claim.status}
                        </p>
                      </div>
                      <p className="bg-gradient-to-r from-indigo-700 to-cyan-600 bg-clip-text font-semibold text-transparent">
                        {claim.amount}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="grid gap-3 sm:grid-cols-3">
              {heroMetrics.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: 0.38 + index * 0.08 }}
                  whileHover={{ y: -4 }}
                  className="rounded-lg border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur"
                >
                  <p className="flex items-center gap-2 bg-gradient-to-r from-slate-950 via-indigo-700 to-cyan-600 bg-clip-text text-2xl font-bold text-transparent">
                    <metric.icon className="size-5 text-cyan-700" />
                    {metric.value}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{metric.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="bg-white/70 py-12">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.28, delay: index * 0.04 }}
              >
                <Card className="h-full border-white bg-white/90 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <CardContent className="p-5">
                    <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-cyan-100 text-indigo-700">
                      <feature.icon className="size-5" />
                    </div>
                    <h2 className="bg-gradient-to-r from-slate-950 via-indigo-700 to-cyan-600 bg-clip-text font-semibold text-transparent">
                      {feature.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {feature.text}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
