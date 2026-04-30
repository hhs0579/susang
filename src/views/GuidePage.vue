<script setup>
import { RouterLink } from "vue-router";
import SiteHeader from "../components/SiteHeader.vue";
import SiteFooter from "../components/SiteFooter.vue";

const menuItems = [
  { label: "SET", to: "/set" },
  { label: "CAMERA", to: "/camera" },
  { label: "LENS", to: "/lens" },
  { label: "GRIP", to: "/grip" },
  { label: "MONITOR", to: "/monitor" },
  { label: "LIGHT", to: "/light" },
  { label: "INTERCOM", to: "/intercom" },
];
</script>

<template>
  <main class="guide-page">
    <SiteHeader />

    <section class="guide-first-section">
      <section class="guide-hero">
        <h1>이용안내</h1>
        <p>수상한렌탈의 장비 대여 방법과 이용 절차를 안내합니다</p>
      </section>

      <section class="guide-info-grid">
        <article class="guide-info-card inquiry-card">
          <h3>
            <img src="/assets/images/icon1.png" alt="" class="guide-icon" />예약
            및 대여 시간
          </h3>
          <p>평일: 09:00 - 19:00</p>
          <p>주말: 10:00 - 18:00</p>
          <p>공휴일: 휴무</p>
          <p>대여/반납 시간은 사전 협의 가능</p>
        </article>
        <article class="guide-info-card">
          <h3>
            <img src="/assets/images/icon2.png" alt="" class="guide-icon" />대여
            장소
          </h3>
          <p>서울시 마포구 잔다리로3길 7 1층</p>
          <p>수상한렌탈 본사</p>
          <p>지하철 2호선 합정역 2번 출구 도보 6분</p>
          <p>주차 가능 (사전 문의 필요)</p>
        </article>
        <article class="guide-info-card">
          <h3>
            <img src="/assets/images/icon3.png" alt="" class="guide-icon" />결제
            방법
          </h3>
          <p>현금 / 계좌이체</p>
          <p>신용카드 / 체크카드</p>
          <p>세금계산서 발행 가능</p>
          <p>보증금은 현금 또는 카드 결제</p>
        </article>
        <article class="guide-info-card">
          <h3>
            <img src="/assets/images/icon4.png" alt="" class="guide-icon" />예약
            문의
          </h3>
          <p>카카오톡 채널: http://pf.kakao.com/_xbxcxhhK</p>
          <p>전화: 010-4139-9844</p>
          <p>이메일: susanghanrental@gmail.com</p>
          <div class="guide-inquiry-bottom">
            <p>7:00 am - 11:00 pm 상담 가능</p>
            <a
              href="http://pf.kakao.com/_xbxcxhhK"
              target="_blank"
              rel="noreferrer"
              class="guide-kakao-link"
              aria-label="카카오톡 예약 문의 바로가기"
            >
              <svg
                class="guide-kakao-link-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M12 4.5C6.75 4.5 2.5 8.01 2.5 12.33C2.5 14.99 4.11 17.34 6.56 18.73L5.77 21.5L8.89 19.8C9.87 20.03 10.91 20.16 12 20.16C17.25 20.16 21.5 16.65 21.5 12.33C21.5 8.01 17.25 4.5 12 4.5Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linejoin="round"
                />
              </svg>
              <span>카카오톡</span>
            </a>
          </div>
        </article>
      </section>
    </section>

    <section class="guide-steps">
      <article class="guide-step-card">
        <strong>01</strong>
        <h4>How to use</h4>
        <p><b>Kakao</b></p>
        <p>
          현재 저희는 카카오톡 채널로 예약을 받고 있습니다.<br />
          카카오톡 채널 방문해주셔서 채팅으로 예약해주시면 됩니다.<br />
          카카오톡에서 수상한렌탈 또는 아래 링크로 친구 추가 해주시고<br />
          렌탈문의 부탁드립니다.<br />
          http://pf.kakao.com/_xbxcxhhK
        </p>
      </article>
      <article class="guide-step-card">
        <strong>02</strong>
        <h4>Payment</h4>
        <p><b>Account</b></p>
        <p>국민은행 830501-04-254913 / 주식회사 수상한렌탈</p>
        <p><b>Payment information</b></p>
        <p>
          세금계산서 발급을 통한 계좌이체 / 카드결제 / 계좌이체 가능합니다.<br />
          홈페이지에 쓰여있는 금액은 vat 포함되어 있지 않는 금액입니다.
        </p>
      </article>
      <article class="guide-step-card">
        <strong>03</strong>
        <h4>Visit Us</h4>
        <p><b>Address</b></p>
        <p>서울특별시 마포구 잔다리로3길 7 지하1층 101호 수상한렌탈</p>
        <p><b>Opening Hours</b></p>
        <p>
          All Day 7:00 am - 11:00 pm<br />
          업무 시간외에 대여 및 반납은 무인으로 진행이 되어 지고 있으며 협의
          하에 대여 전날 반출이 가능합니다.
        </p>
      </article>
    </section>

    <SiteFooter />
  </main>
</template>
