Function Brand_SerialCartKhan(Ceil As String)
s = Trim(Ceil)
L = Len(s)
s2 = Mid(s, 1, 3)
s = Mid(s, 1, 2)

Application.Calculation = xlCalculationManual
Application.ScreenUpdating = False


If L = 7 Then
    If s = "30" Then n = "Pax"
    If s = "37" Then n = "Pax"
    If s = "38" Then n = "Pax"
    If s = "26" Then n = "Pax"
End If


If L = 8 Then
    If s = "29" Then n = "Pax"
    If s = "32" Then n = "Pax"
    If s = "2K" Then n = "Pax"
  
    If s = "5C" Then n = "Pax"
    If s = "51" Then n = "Pax"
   
    If s = "55" Then n = "Pax"
    If s = "72" Then n = "Pax"
    If s = "54" Then n = "Pax"
    If s = "2L" Then n = "Pax"
    If s = "25" Then n = "Pax"
    If s = "3L" Then n = "Pax"
    If s = "3D" Then n = "Pax"
    If s = "3C" Then n = "Pax"
    If s = "7L" Then n = "Pax"
    If s = "7A" Then n = "Pax"
    If s = "68" Then n = "Pax"
    If s = "2k" Then n = "Pax"
    If s = "2l" Then n = "Pax"
    If s = "2M" Then n = "Pax"
    If s = "2N" Then n = "Pax"
    If s = "76" Then n = "Pax"
    If s = "9A" Then n = "Pax"
    
    If s = "03" Then n = "Pax"
    If s = "21" Then n = "Pax"
    If s = "2D" Then n = "Pax"
    If s = "30" Then n = "Pax"
    If s = "36" Then n = "Pax"
    If s = "38" Then n = "Pax"
    If s = "3A" Then n = "Pax"
    If s = "3E" Then n = "Pax"
    If s = "3F" Then n = "Pax"
    If s = "3G" Then n = "Pax"
    If s = "3H" Then n = "Pax"
    If s = "3J" Then n = "Pax"
    If s = "3K" Then n = "Pax"
    If s = "3M" Then n = "Pax"
    If s = "3Q" Then n = "Pax"
    If s = "3W" Then n = "Pax"
    If s = "4A" Then n = "Pax"
    If s = "4C" Then n = "Pax"
    If s = "4D" Then n = "Pax"
    If s = "4H" Then n = "Pax"
    If s = "4K" Then n = "Pax"
    If s = "4Z" Then n = "Pax"
    If s = "5D" Then n = "Pax"
    If s = "5F" Then n = "Pax"
    If s = "6P" Then n = "Pax"
    If s = "7D" Then n = "Pax"
    If s = "88" Then n = "Pax"
    If s = "89" Then n = "Pax"
    If s = "8C" Then n = "Pax"
    If s = "8E" Then n = "Pax"
    If s = "D0" Then n = "Pax"
    If s = "H0" Then n = "Pax"
    If s = "H1" Then n = "Pax"
    If s = "M0" Then n = "Pax"
    If s = "P3" Then n = "Pax"
    If s = "P3" Then n = "Pax"
    
    
    
    
    If s = "2A" Then n = "Pax"
    If s = "23" Then n = "Pax"
    If s = "2R" Then n = "Pax"
    If s = "2P" Then n = "Pax"
    If s = "2H" Then n = "Pax"
    If s = "2Z" Then n = "Pax"
    If s = "26" Then n = "Pax"
    If s = "2Q" Then n = "Pax"
    If s = "2E" Then n = "Pax"
    If s = "2C" Then n = "Pax"
    If s = "45" Then n = "Pax"
   
    
    
End If

If L = 10 Then
    If s = "11" Then n = "Pax"
    If s = "08" Then n = "Pax"

   
   
   If s = "23" Then n = "Pax"

    
    
    
    
End If

If L = 11 Then
    If s = "20" Then n = "Verifone"
    If s = "21" Then n = "Verifone"
    If s = "28" Then n = "Verifone"
    If s = "32" Then n = "Verifone"
    If s = "31" Then n = "Verifone"

    

    
    
    
End If


    
    
    
    




If Mid(s2, 1, 3) = "124" Then n = "Pax"
Brand_SerialCartKhan = n

Application.Calculation = xlCalculationAutomatic
Application.ScreenUpdating = True

End Function
