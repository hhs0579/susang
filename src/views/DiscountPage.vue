<script setup>
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'

const rounds = [
  [
    ['01회차', '00%'],
    ['02회차', '05%'],
    ['03회차', '10%'],
    ['04회차', '15%'],
    ['05회차', '20%'],
  ],
  [
    ['06회차', '22%'],
    ['07회차', '24%'],
    ['08회차', '26%'],
    ['09회차', '28%'],
    ['10회차', '30%'],
  ],
  [
    ['11회차', '31%'],
    ['12회차', '32%'],
    ['13회차', '33%'],
    ['14회차', '34%'],
    ['15회차', '35%'],
  ],
  [
    ['16회차', '36%'],
    ['17회차', '37%'],
    ['18회차', '38%'],
    ['19회차', '39%'],
    ['20회차', '40%'],
  ],
]
</script>

<template>
  <main class="discount-page">
    <SiteHeader />

    <section class="discount-wrap">
      <h1 class="discount-main-title">할인 정보</h1>
      <p class="discount-main-sub">다양한 할인 혜택으로 더 저렴하게 이용하세요</p>

      <h2 class="discount-section-title">독립할인</h2>
      <div class="discount-box-grid">
        <article class="discount-box">
          <h3 class="discount-box-title">20% 적용</h3>
          <p class="discount-text">
            독립작품은 렌탈 총액에 20% 적용됩니다.<br />
            단 세금계산서 및 카드 결제가 불가합니다.
          </p>
        </article>
        <article class="discount-box">
          <h3 class="discount-box-title">서류 지참</h3>
          <p class="discount-text">
            독립작품임을 증명 할 수 있는 서류 (시나리오 / 일촬표)를<br />
            지참 후 렌탈시 보여주셔야 적용 가능합니다.
          </p>
        </article>
      </div>

      <h2 class="discount-section-title">회차할인</h2>
      <p class="discount-section-sub">
        장기렌탈은 아래 정해진 할인율을 적용하여 할인 진행하고 있습니다. / 2회차 부터 적용
      </p>
      <div class="discount-round-grid">
        <article v-for="(column, columnIndex) in rounds" :key="columnIndex" class="discount-round-column">
          <p v-for="([round, rate]) in column" :key="round" class="discount-round-item">
            <span>{{ round }}</span>
            <span class="discount-divider">ㅣ</span>
            <strong>{{ rate }}</strong>
          </p>
        </article>
      </div>

      <div class="discount-box-grid bottom">
        <article class="discount-box">
          <h3 class="discount-box-title discount-box-title-large">선결제할인</h3>
          <ul class="discount-list">
            <li>반출 전</li>
            <li>반납 당일까지 결제시 선결제할인 10% 적용됩니다.</li>
          </ul>
        </article>
        <article class="discount-box">
          <div class="discount-box-heading">
            <h3 class="discount-box-title discount-box-title-large">단골할인</h3>
            <span class="discount-new">NEW</span>
          </div>
          <ul class="discount-list">
            <li>누적 대여 건수 10회 이상 5% 추가 할인</li>
            <li>누적 대여 건수 15회 이상 10% 추가 할인</li>
          </ul>
        </article>
      </div>

      <hr class="discount-divider-line" />

      <h2 class="discount-section-title">유의사항</h2>

      <h3 class="discount-note-title">Problem</h3>
      <ul class="discount-note-list">
        <li>장비를 출고하기 전에 테스트를 통해 장비 작동의 이상 유/무를 확인 해야 합니다.</li>
        <li>이후에 발생되는 문제는 책임지지 않습니다.</li>
        <li>장비 파손시 이용약관에 따른 절차로 진행되어집니다.</li>
        <li>당일 예약 취소는 위약금 50%가 발생 됩니다.</li>
        <li>
          저희 렌탈샵은 24시간 cctv 녹화가 되어 지고 있어 장비 문제시 자료로 보여드릴 수 있습니다.
        </li>
      </ul>

      <h3 class="discount-note-title">Document</h3>
      <ul class="discount-note-list">
        <li>첫 장비 대여시 신분증 / 사업자등록증이 필요합니다.</li>
        <li>서류제출 거부시 렌탈이 불가합니다.</li>
      </ul>
    </section>

    <SiteFooter />
  </main>
</template>
