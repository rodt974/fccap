package com.salaire.app

import android.os.Bundle
import android.view.View
import android.widget.RadioGroup
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView
import com.google.android.material.button.MaterialButton
import com.google.android.material.tabs.TabLayout
import com.google.android.material.textfield.TextInputEditText
import java.text.NumberFormat
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var tabMode: TabLayout
    private lateinit var cardBrutNet: CardView
    private lateinit var cardTauxHoraire: CardView
    private lateinit var cardResultats: CardView

    private lateinit var editSalaireBrut: TextInputEditText
    private lateinit var editPrime: TextInputEditText
    private lateinit var editTauxHoraire: TextInputEditText
    private lateinit var editHeures: TextInputEditText

    private lateinit var radioGroupStatut: RadioGroup

    private lateinit var btnCalculer: MaterialButton
    private lateinit var btnReinitialiser: MaterialButton

    private lateinit var txtResultBrut: TextView
    private lateinit var txtResultCotisations: TextView
    private lateinit var txtResultNet: TextView
    private lateinit var txtResultAnnuelBrut: TextView
    private lateinit var txtResultAnnuelNet: TextView

    private val currencyFormat = NumberFormat.getCurrencyInstance(Locale.FRANCE)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initViews()
        setupListeners()
    }

    private fun initViews() {
        tabMode = findViewById(R.id.tabMode)
        cardBrutNet = findViewById(R.id.cardBrutNet)
        cardTauxHoraire = findViewById(R.id.cardTauxHoraire)
        cardResultats = findViewById(R.id.cardResultats)

        editSalaireBrut = findViewById(R.id.editSalaireBrut)
        editPrime = findViewById(R.id.editPrime)
        editTauxHoraire = findViewById(R.id.editTauxHoraire)
        editHeures = findViewById(R.id.editHeures)

        radioGroupStatut = findViewById(R.id.radioGroupStatut)

        btnCalculer = findViewById(R.id.btnCalculer)
        btnReinitialiser = findViewById(R.id.btnReinitialiser)

        txtResultBrut = findViewById(R.id.txtResultBrut)
        txtResultCotisations = findViewById(R.id.txtResultCotisations)
        txtResultNet = findViewById(R.id.txtResultNet)
        txtResultAnnuelBrut = findViewById(R.id.txtResultAnnuelBrut)
        txtResultAnnuelNet = findViewById(R.id.txtResultAnnuelNet)
    }

    private fun setupListeners() {
        tabMode.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab?) {
                when (tab?.position) {
                    0 -> {
                        cardBrutNet.visibility = View.VISIBLE
                        cardTauxHoraire.visibility = View.GONE
                    }
                    1 -> {
                        cardBrutNet.visibility = View.GONE
                        cardTauxHoraire.visibility = View.VISIBLE
                    }
                }
                cardResultats.visibility = View.GONE
            }

            override fun onTabUnselected(tab: TabLayout.Tab?) {}
            override fun onTabReselected(tab: TabLayout.Tab?) {}
        })

        btnCalculer.setOnClickListener { calculerSalaire() }
        btnReinitialiser.setOnClickListener { reinitialiser() }
    }

    private fun getTauxCotisation(): Double {
        return when (radioGroupStatut.checkedRadioButtonId) {
            R.id.radioNonCadre -> 0.22
            R.id.radioCadre -> 0.25
            R.id.radioFonction -> 0.15
            else -> 0.22
        }
    }

    private fun calculerSalaire() {
        val selectedTab = tabMode.selectedTabPosition
        val tauxCotisation = getTauxCotisation()

        val salaireBrutMensuel: Double

        if (selectedTab == 0) {
            // Mode Brut → Net
            val brutText = editSalaireBrut.text.toString()
            if (brutText.isEmpty()) {
                Toast.makeText(this, "Veuillez saisir le salaire brut", Toast.LENGTH_SHORT).show()
                return
            }
            salaireBrutMensuel = brutText.toDoubleOrNull() ?: 0.0

            val primeText = editPrime.text.toString()
            val prime = if (primeText.isNotEmpty()) primeText.toDoubleOrNull() ?: 0.0 else 0.0

            afficherResultats(salaireBrutMensuel + prime, tauxCotisation)
        } else {
            // Mode Taux Horaire
            val tauxText = editTauxHoraire.text.toString()
            val heuresText = editHeures.text.toString()

            if (tauxText.isEmpty()) {
                Toast.makeText(this, "Veuillez saisir le taux horaire", Toast.LENGTH_SHORT).show()
                return
            }

            val taux = tauxText.toDoubleOrNull() ?: 0.0
            val heures = if (heuresText.isNotEmpty()) heuresText.toDoubleOrNull() ?: 35.0 else 35.0

            // Calcul mensuel : taux * heures * 52 semaines / 12 mois
            salaireBrutMensuel = taux * heures * 52.0 / 12.0

            afficherResultats(salaireBrutMensuel, tauxCotisation)
        }
    }

    private fun afficherResultats(brutMensuel: Double, tauxCotisation: Double) {
        val cotisations = brutMensuel * tauxCotisation
        val netMensuel = brutMensuel - cotisations
        val brutAnnuel = brutMensuel * 12
        val netAnnuel = netMensuel * 12

        txtResultBrut.text = currencyFormat.format(brutMensuel)
        txtResultCotisations.text = "- ${currencyFormat.format(cotisations)}"
        txtResultNet.text = currencyFormat.format(netMensuel)
        txtResultAnnuelBrut.text = currencyFormat.format(brutAnnuel)
        txtResultAnnuelNet.text = currencyFormat.format(netAnnuel)

        cardResultats.visibility = View.VISIBLE
    }

    private fun reinitialiser() {
        editSalaireBrut.text?.clear()
        editPrime.text?.clear()
        editTauxHoraire.text?.clear()
        editHeures.setText("35")
        radioGroupStatut.check(R.id.radioNonCadre)
        cardResultats.visibility = View.GONE
    }
}
